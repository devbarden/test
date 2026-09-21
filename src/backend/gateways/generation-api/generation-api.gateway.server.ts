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
	//   Redirects are refused: following one would resend the prompt and the
	//   token elsewhere.
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
	//   A closed connection and `data: [DONE]` both end a letter; a broken one
	//   throws on read.
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
		//   Our token was refused: a deployment problem, shown to the user as
		//   unavailable.
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
//   A 200 that is not SSE (a proxy page, a JSON error) would become an empty
//   letter.
// ═══════════════════════════════════════════════════════════════════════════
function isEventStream(response: Response): boolean {
	const type = response.headers.get('content-type')

	return type === null || type.toLowerCase().startsWith(EVENT_STREAM)
}

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
