import { z } from 'zod'
import type { AppConfig } from '../../config.server'
import { UpstreamError } from '../../errors.server'
import type { Logger } from '../../observability/logger.server'
import { createSseParser } from './sse-parser'
import { createWatchdog, type Watchdog } from './watchdog'

const DEFAULT_RETRY_AFTER_SECONDS = 60
const DONE_SENTINEL = '[DONE]'

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
	const { apiToken, apiUrl, firstByteTimeoutMs, idleTimeoutMs, maxTokens } =
		config.generation

	// ═════════════════════════════════════════════════════════════════════════
	//   Two phases, so the caller can answer with a real HTTP status for
	//   everything that goes wrong before the first byte: this resolves only
	//   once the provider has said 200, and throws otherwise. Failures after
	//   that surface while iterating the returned stream.
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
					Accept: 'text/event-stream',
					Authorization: `Bearer ${apiToken}`,
					'Content-Type': 'application/json',
				},
				method: 'POST',
				signal: AbortSignal.any([signal, watchdog.signal]),
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
						`Generation API sent an error event: ${data}`,
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
		const body = await response.text().catch(() => '')
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
		throw new UpstreamError('interrupted', `Malformed delta event: ${data}`, {
			cause,
		})
	}
}

function parseRetryAfter(header: string | null): number {
	const seconds = Number.parseInt(header ?? '', 10)

	return Number.isFinite(seconds) && seconds > 0
		? seconds
		: DEFAULT_RETRY_AFTER_SECONDS
}
