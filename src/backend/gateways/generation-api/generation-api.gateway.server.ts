import { z } from 'zod'
import type { AppConfig } from '@/backend/config.server'
import { UpstreamError } from '@/backend/errors/app-error.server'
import type { Logger } from '@/backend/observability/logger.server'
import { createSseParser } from './sse-parser'
import { createWatchdog, type Watchdog } from './watchdog'

const DEFAULT_RETRY_AFTER_SECONDS = 60
const LOG_EXCERPT_LIMIT = 2_000
const DONE_SENTINEL = '[DONE]'
const EVENT_STREAM = 'text/event-stream'

const deltaSchema = z.object({ text: z.string() })

export type GenerationRequest = {
	prompt: string
	signal: AbortSignal
	system: string
}

// ═══════════════════════════════════════════════════════════════════════════
//   The one place that speaks the Generation API's wire format. Everything
//   above it sees an async iterable of text fragments and AppErrors — never
//   SSE, never the provider's status codes or error bodies.
// ═══════════════════════════════════════════════════════════════════════════
export function createGenerationApiGateway({
	config,
	rootLogger,
}: {
	config: AppConfig
	rootLogger: Logger
}) {
	const {
		apiToken,
		apiUrl,
		firstByteTimeoutMs,
		idleTimeoutMs,
		maxDurationMs,
		maxTokens,
	} = config.generation

	// ═════════════════════════════════════════════════════════════════════════
	//   Two phases, so the caller can answer with a real HTTP status for
	//   everything that goes wrong before the first byte: this resolves only
	//   once the provider has said 200, and throws otherwise. Failures after
	//   that surface while iterating the returned stream.
	//
	//   Three clocks bound a request: the watchdog allows firstByteTimeoutMs
	//   to the first byte and idleTimeoutMs between events, and
	//   maxDurationMs caps the whole letter. That last one is not about
	//   health — a slow letter that keeps streaming is fine — but about the
	//   one-generation lock, whose TTL must outlast any generation.
	//
	//   Redirects are refused rather than followed: this endpoint never
	//   moves, and following one would re-send the prompt (and, same-origin,
	//   the token) to wherever a misconfigured proxy points, or silently
	//   turn the POST into a GET.
	// ═════════════════════════════════════════════════════════════════════════
	async function openStream({
		prompt,
		signal,
		system,
	}: GenerationRequest): Promise<AsyncGenerator<string>> {
		const watchdog = createWatchdog()

		watchdog.arm(firstByteTimeoutMs)

		let response: Response

		try {
			response = await fetch(apiUrl, {
				body: JSON.stringify({ maxTokens, prompt, system }),
				headers: {
					Accept: EVENT_STREAM,
					Authorization: `Bearer ${apiToken}`,
					'Content-Type': 'application/json',
				},
				method: 'POST',
				redirect: 'error',
				signal: AbortSignal.any([
					signal,
					watchdog.signal,
					AbortSignal.timeout(maxDurationMs),
				]),
			})
		} catch (cause) {
			watchdog.disarm()
			throw new UpstreamError('unavailable', 'Generation API unreachable', {
				cause,
			})
		}

		if (!response.ok || !response.body) {
			watchdog.disarm()
			throw await failureFromResponse(response)
		}

		if (!isEventStream(response)) {
			watchdog.disarm()
			await response.body.cancel().catch(() => {})
			throw new UpstreamError(
				'unavailable',
				`Generation API answered 200 with ${response.headers.get('content-type')}`,
			)
		}

		return readDeltas(response.body, watchdog)
	}

	// ═════════════════════════════════════════════════════════════════════════
	//   The documented protocol ends a letter by closing the connection; the
	//   live service sends `data: [DONE]` first. Both count as a clean finish.
	//   A connection that BREAKS surfaces as a read error, which is what
	//   separates it from the two above. Unknown events are ignored rather
	//   than rejected, so the provider can add one without breaking us.
	// ═════════════════════════════════════════════════════════════════════════
	async function* readDeltas(
		body: NonNullable<Response['body']>,
		watchdog: Watchdog,
	): AsyncGenerator<string> {
		const events = body
			.pipeThrough(new TextDecoderStream())
			.pipeThrough(createSseParser())

		try {
			for await (const { data, event } of events) {
				watchdog.arm(idleTimeoutMs)

				if (data === DONE_SENTINEL) return

				if (event === 'error') {
					throw new UpstreamError(
						'interrupted',
						`Generation API sent an error event: ${excerpt(data)}`,
					)
				}

				if (event === 'delta') yield parseDelta(data)
			}
		} catch (cause) {
			if (cause instanceof UpstreamError) throw cause

			throw new UpstreamError('interrupted', 'Generation stream broke off', {
				cause,
			})
		} finally {
			watchdog.disarm()
		}
	}

	async function failureFromResponse(
		response: Response,
	): Promise<UpstreamError> {
		const requestId = response.headers.get('x-request-id') ?? 'unknown'
		const body = await readPrefix(response, LOG_EXCERPT_LIMIT)
		const detail = `Generation API responded ${response.status} (request ${requestId}): ${body}`

		if (response.status === 429) {
			return new UpstreamError('rate_limited', detail, {
				retryAfterSeconds: parseRetryAfter(response.headers.get('retry-after')),
			})
		}

		// ═════════════════════════════════════════════════════════════════════
		//   A 401 means OUR token was refused — a deployment problem, not the
		//   user's. It is reported to them as the service being unavailable and
		//   logged at error level, since nobody can generate until it is fixed.
		// ═════════════════════════════════════════════════════════════════════
		if (response.status === 401) {
			rootLogger.error({ requestId }, 'Generation API rejected the token')
		}

		return new UpstreamError('unavailable', detail)
	}

	return { openStream }
}

export type GenerationApiGateway = ReturnType<typeof createGenerationApiGateway>

function parseDelta(data: string): string {
	try {
		return deltaSchema.parse(JSON.parse(data)).text
	} catch (cause) {
		throw new UpstreamError(
			'interrupted',
			`Malformed delta event: ${excerpt(data)}`,
			{ cause },
		)
	}
}

// ═══════════════════════════════════════════════════════════════════════════
//   A 200 that is not an event stream — a proxy's HTML page, a JSON error
//   some gateway sends with a success status — would otherwise parse as a
//   stream with no deltas and surface only after the fact as an empty
//   letter. Refused here, it is an honest 502 before the first byte. A
//   response that names no type at all is given the benefit of the doubt.
// ═══════════════════════════════════════════════════════════════════════════
function isEventStream(response: Response): boolean {
	const type = response.headers.get('content-type')

	return type === null || type.toLowerCase().startsWith(EVENT_STREAM)
}

// ═══════════════════════════════════════════════════════════════════════════
//   Provider text reaches the log only as an excerpt: an SSE event may be
//   up to 64 kB, and a delta is the user's letter — neither belongs in a
//   log line whole.
// ═══════════════════════════════════════════════════════════════════════════
function excerpt(text: string): string {
	return text.length > LOG_EXCERPT_LIMIT
		? `${text.slice(0, LOG_EXCERPT_LIMIT)}…`
		: text
}

function parseRetryAfter(header: string | null): number {
	const seconds = Number.parseInt(header ?? '', 10)

	return Number.isFinite(seconds) && seconds > 0
		? seconds
		: DEFAULT_RETRY_AFTER_SECONDS
}

// ═══════════════════════════════════════════════════════════════════════════
//   An error body is read only as far as the log needs it. However the
//   provider misbehaves, a refusal cannot make this process buffer an
//   unbounded response.
// ═══════════════════════════════════════════════════════════════════════════
async function readPrefix(response: Response, limit: number): Promise<string> {
	if (!response.body) return ''

	const reader = response.body.getReader()
	const decoder = new TextDecoder()
	let text = ''

	try {
		while (text.length < limit) {
			const { done, value } = await reader.read()

			if (done) break

			text += decoder.decode(value, { stream: true })
		}
	} catch {
		return text.slice(0, limit)
	} finally {
		await reader.cancel().catch(() => {})
	}

	return text.slice(0, limit)
}
