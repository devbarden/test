import { EventSourceParserStream } from 'eventsource-parser/stream'
import { z } from 'zod'
import type { AppConfig } from '../config.server'
import { UpstreamError } from '../errors/app-error.server'
import type { Logger } from '../observability/logger.server'

const deltaSchema = z.object({ text: z.string() })

type GenerationRequest = {
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
	const { apiToken, apiUrl, maxDurationMs, maxTokens } = config.generation

	async function openStream({ prompt, signal, system }: GenerationRequest) {
		const response = await fetch(apiUrl, {
			body: JSON.stringify({ maxTokens, prompt, system }),
			headers: {
				Accept: 'text/event-stream',
				Authorization: `Bearer ${apiToken}`,
				'Content-Type': 'application/json',
			},
			method: 'POST',
			redirect: 'error',
			signal: AbortSignal.any([signal, AbortSignal.timeout(maxDurationMs)]),
		}).catch((cause: unknown) => {
			throw new UpstreamError('unavailable', 'Generation API unreachable', {
				cause,
			})
		})

		if (response.status === 401) {
			rootLogger.error('Generation API rejected the token')
		}

		if (response.status === 429) {
			const retryAfter = Number(response.headers.get('retry-after'))

			throw new UpstreamError('rate_limited', 'Generation API rate limited', {
				retryAfterSeconds: retryAfter > 0 ? retryAfter : 60,
			})
		}

		if (!response.ok || !response.body) {
			throw new UpstreamError(
				'unavailable',
				`Generation API responded ${response.status}`,
			)
		}

		return readDeltas(response.body)
	}

	return { openStream }
}

export type GenerationApiGateway = ReturnType<typeof createGenerationApiGateway>

async function* readDeltas(body: NonNullable<Response['body']>) {
	const events = body
		.pipeThrough(new TextDecoderStream())
		.pipeThrough(new EventSourceParserStream({ maxBufferSize: 64 * 1024 }))

	try {
		for await (const { data, event } of events) {
			if (data === '[DONE]') return
			if (event === 'error') throw new Error(data)
			if (event === 'delta') yield deltaSchema.parse(JSON.parse(data)).text
		}
	} catch (cause) {
		throw new UpstreamError('interrupted', 'Generation stream broke off', {
			cause,
		})
	}
}
