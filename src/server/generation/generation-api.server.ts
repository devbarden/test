import { z } from 'zod'
import { getServerEnv } from '../env.server'
import { GenerationFailure } from './generation-failure'
import { createSseParser } from './sse-parser'
import { createWatchdog, type Watchdog } from './watchdog'

const MAX_TOKENS = 800
const FIRST_BYTE_TIMEOUT_MS = 30_000
const IDLE_TIMEOUT_MS = 20_000
const DEFAULT_RETRY_AFTER_SECONDS = 60
const DONE_SENTINEL = '[DONE]'

const deltaSchema = z.object({ text: z.string() })

type GenerationRequest = {
	prompt: string
	signal: AbortSignal
	system: string
}

// ═══════════════════════════════════════════════════════════════════════════
//   Two phases, so the route can answer with a real HTTP status for
//   everything that goes wrong before the first byte: this function resolves
//   only once the upstream has said 200, and throws a GenerationFailure
//   otherwise. What it resolves to is the letter as a stream of text
//   fragments; failures from then on surface while iterating it.
// ═══════════════════════════════════════════════════════════════════════════
export async function openGenerationStream({
	prompt,
	signal,
	system,
}: GenerationRequest): Promise<AsyncGenerator<string>> {
	const env = getServerEnv()
	const watchdog = createWatchdog()

	watchdog.arm(FIRST_BYTE_TIMEOUT_MS)

	let response: Response

	try {
		response = await fetch(env.GENERATION_API_URL, {
			body: JSON.stringify({ maxTokens: MAX_TOKENS, prompt, system }),
			headers: {
				Accept: 'text/event-stream',
				Authorization: `Bearer ${env.GENERATION_API_TOKEN}`,
				'Content-Type': 'application/json',
			},
			method: 'POST',
			signal: AbortSignal.any([signal, watchdog.signal]),
		})
	} catch (cause) {
		watchdog.disarm()
		throw toGenerationFailure(cause)
	}

	if (!response.ok || !response.body) {
		watchdog.disarm()
		throw await failureFromResponse(response)
	}

	return readDeltas(response.body, watchdog)
}

// ═══════════════════════════════════════════════════════════════════════════
//   The documented protocol ends a letter by closing the connection; the
//   live service sends `data: [DONE]` first. Both are accepted as a clean
//   finish. A connection that breaks instead of closing surfaces as a read
//   error from the body, which is what separates it from the two above.
//   Events other than `delta` are ignored rather than rejected, so the
//   service can add one without breaking every client in flight.
// ═══════════════════════════════════════════════════════════════════════════
async function* readDeltas(
	body: NonNullable<Response['body']>,
	watchdog: Watchdog,
): AsyncGenerator<string> {
	const events = body
		.pipeThrough(new TextDecoderStream())
		.pipeThrough(createSseParser())

	try {
		for await (const { data, event } of events) {
			watchdog.arm(IDLE_TIMEOUT_MS)

			if (data === DONE_SENTINEL) return

			if (event === 'error') {
				throw new GenerationFailure(
					{ code: 'interrupted' },
					`Upstream sent an error event: ${data}`,
				)
			}

			if (event === 'delta') yield parseDelta(data)
		}
	} catch (cause) {
		throw toGenerationFailure(cause, 'interrupted')
	} finally {
		watchdog.disarm()
	}
}

function parseDelta(data: string): string {
	try {
		return deltaSchema.parse(JSON.parse(data)).text
	} catch (cause) {
		throw new GenerationFailure(
			{ code: 'interrupted' },
			`Malformed delta event: ${data}`,
			{ cause },
		)
	}
}

async function failureFromResponse(
	response: Response,
): Promise<GenerationFailure> {
	const requestId = response.headers.get('x-request-id') ?? 'unknown'
	const body = await response.text().catch(() => '')
	const detail = `Upstream ${response.status} (request ${requestId}): ${body}`

	if (response.status === 429) {
		return new GenerationFailure(
			{
				code: 'rate_limited',
				retryAfterSeconds: parseRetryAfter(response.headers.get('retry-after')),
			},
			detail,
		)
	}

	if (response.status === 400) {
		return new GenerationFailure({ code: 'invalid_request' }, detail)
	}

	return new GenerationFailure({ code: 'unavailable' }, detail)
}

function parseRetryAfter(header: string | null): number {
	const seconds = Number.parseInt(header ?? '', 10)

	return Number.isFinite(seconds) && seconds > 0
		? seconds
		: DEFAULT_RETRY_AFTER_SECONDS
}

function toGenerationFailure(
	cause: unknown,
	fallbackCode: 'interrupted' | 'unavailable' = 'unavailable',
): GenerationFailure {
	if (cause instanceof GenerationFailure) return cause

	const message = cause instanceof Error ? cause.message : String(cause)

	return new GenerationFailure({ code: fallbackCode }, message, { cause })
}
