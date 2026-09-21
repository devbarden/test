import { applicationInputSchema } from '@/features/applications/model/application-input'
import type {
	GenerationError,
	GenerationErrorCode,
	GenerationEvent,
} from '@/features/generation/protocol'
import { readableStreamFrom } from '@/lib/readable-stream-from'
import { buildCoverLetterPrompt } from './cover-letter-prompt'
import { openGenerationStream } from './generation-api.server'
import { GenerationFailure } from './generation-failure'
import { createRateLimiter } from './rate-limiter'

const STATUS_BY_CODE: Record<GenerationErrorCode, number> = {
	interrupted: 502,
	invalid_request: 400,
	rate_limited: 429,
	unauthorized: 401,
	unavailable: 502,
}

const userRateLimiter = createRateLimiter({ limit: 4, windowMs: 60_000 })

// ═══════════════════════════════════════════════════════════════════════════
//   Four fields whose limits add up to ~1.7k characters; 16 kB leaves room
//   for multi-byte text and JSON escaping, and refuses anything else before
//   it is read into memory and parsed.
// ═══════════════════════════════════════════════════════════════════════════
const MAX_BODY_BYTES = 16 * 1024

export async function handleGenerateRequest(
	request: Request,
	userId: string,
): Promise<Response> {
	if (!request.headers.get('content-type')?.includes('application/json')) {
		return errorResponse({ code: 'invalid_request' })
	}

	const input = applicationInputSchema.safeParse(await readJsonBody(request))

	if (!input.success) return errorResponse({ code: 'invalid_request' })

	const decision = userRateLimiter.consume(userId)

	if (!decision.allowed) {
		return errorResponse({
			code: 'rate_limited',
			retryAfterSeconds: decision.retryAfterSeconds,
		})
	}

	try {
		const deltas = await openGenerationStream({
			...buildCoverLetterPrompt(input.data),
			signal: request.signal,
		})

		return ndjsonResponse(toEvents(deltas, request.signal))
	} catch (cause) {
		const failure = asFailure(cause)

		reportFailure(failure, request.signal)

		return errorResponse(failure.error)
	}
}

async function readJsonBody(request: Request): Promise<unknown> {
	const declaredLength = Number(request.headers.get('content-length') ?? 0)

	if (declaredLength > MAX_BODY_BYTES) return null

	const text = await request.text()

	if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) return null

	try {
		return JSON.parse(text)
	} catch {
		return null
	}
}

export function errorResponse(error: GenerationError): Response {
	const headers = new Headers({ 'Cache-Control': 'no-store' })

	if (error.retryAfterSeconds) {
		headers.set('Retry-After', String(error.retryAfterSeconds))
	}

	return Response.json(
		{ error },
		{ headers, status: STATUS_BY_CODE[error.code] },
	)
}

async function* toEvents(
	deltas: AsyncIterable<string>,
	signal: AbortSignal,
): AsyncGenerator<GenerationEvent> {
	try {
		for await (const text of deltas) yield { text, type: 'delta' }

		yield { type: 'done' }
	} catch (cause) {
		const failure = asFailure(cause)

		reportFailure(failure, signal)

		if (!signal.aborted) yield { error: failure.error, type: 'error' }
	}
}

// ═══════════════════════════════════════════════════════════════════════════
//   `no-transform` and `X-Accel-Buffering: no` ask every proxy on the way
//   (Railway's edge included) not to compress or buffer the body — either
//   would hold fragments back and turn a stream into one late delivery.
//   Cancelling the body (the browser navigated away) runs `return()` on the
//   generators above, which cancels the upstream fetch in turn.
// ═══════════════════════════════════════════════════════════════════════════
function ndjsonResponse(events: AsyncIterable<GenerationEvent>): Response {
	const body = readableStreamFrom(events)
		.pipeThrough(
			new TransformStream<GenerationEvent, string>({
				transform(event, controller) {
					controller.enqueue(`${JSON.stringify(event)}\n`)
				},
			}),
		)
		.pipeThrough(new TextEncoderStream())

	return new Response(body, {
		headers: {
			'Cache-Control': 'no-store, no-transform',
			'Content-Type': 'application/x-ndjson; charset=utf-8',
			'X-Accel-Buffering': 'no',
		},
	})
}

function asFailure(cause: unknown): GenerationFailure {
	if (cause instanceof GenerationFailure) return cause

	return new GenerationFailure({ code: 'unavailable' }, String(cause), {
		cause,
	})
}

// ═══════════════════════════════════════════════════════════════════════════
//   A request the browser abandoned is not a failure worth a log line — it
//   is the user pressing Stop or leaving the page.
// ═══════════════════════════════════════════════════════════════════════════
function reportFailure(failure: GenerationFailure, signal: AbortSignal) {
	if (signal.aborted) return

	console.error(`[generate] ${failure.error.code}: ${failure.message}`)
}
