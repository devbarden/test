import { setTimeout as sleep } from 'node:timers/promises'
import type { AppConfig } from '../../config.server'
import type { Logger } from '../../observability/logger.server'
import { isTransient, refusalError, toUpstreamError } from './generation-api-errors.server'
import { readDeltas } from './generation-api-stream.server'
import { createStreamWatchdog } from './stream-watchdog.server'

const RETRY_DELAY_MS = 750

type GenerationRequest = {
	prompt: string
	signal: AbortSignal
	system: string
}

export function createGenerationApiGateway({ config, rootLogger }: { config: AppConfig; rootLogger: Logger }) {
	const { apiToken, apiUrl, idleTimeoutMs, maxDurationMs, maxTokens } = config.generation
	const headers = {
		Accept: 'text/event-stream',
		Authorization: `Bearer ${apiToken}`,
		'Content-Type': 'application/json',
	}

	// ═════════════════════════════════════════════════════════════════════════
	//   Retried once, and only before the first byte: a dropped connection
	//   or a 5xx there has cost nothing and usually clears at once. A stream
	//   that breaks later is reported, since the user is already watching.
	// ═════════════════════════════════════════════════════════════════════════
	async function openStream(request: GenerationRequest): Promise<AsyncGenerator<string>> {
		try {
			return await connect(request)
		} catch (error) {
			if (!isTransient(error)) throw error

			rootLogger.warn({ err: error }, 'Generation API failed; retrying once')
			await sleep(RETRY_DELAY_MS)

			return connect(request)
		}
	}

	async function connect({ prompt, signal, system }: GenerationRequest): Promise<AsyncGenerator<string>> {
		const watchdog = createStreamWatchdog({ idleTimeoutMs, maxDurationMs, signal })

		try {
			const response = await fetch(apiUrl, {
				body: JSON.stringify({ maxTokens, prompt, system }),
				headers,
				method: 'POST',
				redirect: 'error',
				signal: watchdog.signal,
			})

			if (!response.ok || !response.body) throw refusalError(response)

			return readDeltas(response.body, watchdog)
		} catch (error) {
			watchdog.stop()
			throw toUpstreamError(error, signal)
		}
	}

	return { openStream }
}

export type GenerationApiGateway = ReturnType<typeof createGenerationApiGateway>
