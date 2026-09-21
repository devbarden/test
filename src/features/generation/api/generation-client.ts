import type { ApplicationDto } from '@/features/applications/model/application.schema'
import { type ApiError, apiErrorBodySchema } from '@/lib/api/api-error'
import { createLineSplitter } from '@/lib/streams/line-splitter'
import {
	GENERATION_ENDPOINT,
	type GenerateCommand,
	type GenerationEvent,
	generationEventSchema,
} from '../model/protocol'

// ═══════════════════════════════════════════════════════════════════════════
//   Longer than any server silence: only a dead socket (a phone switching
//   networks) trips it.
// ═══════════════════════════════════════════════════════════════════════════
const IDLE_TIMEOUT_MS = 60_000

export class LetterGenerationFailure extends Error {
	readonly error: ApiError

	constructor(error: ApiError) {
		super(`Letter generation failed: ${error.code}`)
		this.name = 'LetterGenerationFailure'
		this.error = error
	}
}

export type LetterStreamEvent = Extract<
	GenerationEvent,
	{ type: 'delta' | 'saving' }
>

// ═══════════════════════════════════════════════════════════════════════════
//   A body that ends without `done` is a failure, never a short letter.
// ═══════════════════════════════════════════════════════════════════════════
export async function* requestLetter(
	command: GenerateCommand,
	signal: AbortSignal,
): AsyncGenerator<LetterStreamEvent, ApplicationDto> {
	const connection = createIdleAbort(signal, IDLE_TIMEOUT_MS)

	try {
		const response = await postCommand(command, connection.signal, signal)

		if (!response.ok || !response.body) {
			throw await failureFromResponse(response)
		}

		const lines = response.body
			.pipeThrough(new TextDecoderStream())
			.pipeThrough(createLineSplitter())

		for await (const line of readAll(lines)) {
			connection.reset()

			const event = generationEventSchema.parse(JSON.parse(line))

			if (event.type === 'delta' || event.type === 'saving') yield event
			if (event.type === 'error') throw new LetterGenerationFailure(event.error)
			if (event.type === 'done') return event.application
		}
	} catch (cause) {
		if (cause instanceof LetterGenerationFailure || signal.aborted) throw cause

		throw new LetterGenerationFailure({ code: 'interrupted' })
	} finally {
		connection.dispose()
	}

	throw new LetterGenerationFailure({ code: 'interrupted' })
}

async function postCommand(
	command: GenerateCommand,
	connection: AbortSignal,
	stop: AbortSignal,
): Promise<Response> {
	try {
		return await fetch(GENERATION_ENDPOINT, {
			body: JSON.stringify(command),
			headers: { 'Content-Type': 'application/json' },
			method: 'POST',
			signal: connection,
		})
	} catch (cause) {
		if (stop.aborted) throw cause

		throw new LetterGenerationFailure({
			code: connection.aborted ? 'interrupted' : 'network',
		})
	}
}

// ═══════════════════════════════════════════════════════════════════════════
//   Linked by hand: AbortSignal.any is missing before Safari 17.4.
// ═══════════════════════════════════════════════════════════════════════════
function createIdleAbort(parent: AbortSignal, timeoutMs: number) {
	const controller = new AbortController()
	const follow = () => controller.abort(parent.reason)
	let timer: ReturnType<typeof setTimeout> | undefined

	const reset = () => {
		clearTimeout(timer)
		timer = setTimeout(
			() =>
				controller.abort(
					new DOMException(`No data for ${timeoutMs} ms`, 'TimeoutError'),
				),
			timeoutMs,
		)
	}

	if (parent.aborted) follow()
	else parent.addEventListener('abort', follow, { once: true })

	reset()

	return {
		dispose() {
			clearTimeout(timer)
			parent.removeEventListener('abort', follow)
		},
		reset,
		signal: controller.signal,
	}
}

async function failureFromResponse(
	response: Response,
): Promise<LetterGenerationFailure> {
	const body = apiErrorBodySchema.safeParse(
		await response.json().catch(() => null),
	)

	if (body.success) return new LetterGenerationFailure(body.data.error)

	return new LetterGenerationFailure({
		code: response.status === 401 ? 'unauthorized' : 'unavailable',
	})
}

// ═══════════════════════════════════════════════════════════════════════════
//   A reader loop: Safari got async iteration of streams late.
// ═══════════════════════════════════════════════════════════════════════════
async function* readAll<T>(stream: ReadableStream<T>): AsyncGenerator<T> {
	const reader = stream.getReader()

	try {
		for (;;) {
			const { done, value } = await reader.read()

			if (done) return

			yield value
		}
	} finally {
		reader.releaseLock()
	}
}
