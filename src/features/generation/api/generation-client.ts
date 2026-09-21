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
//   Longer than any silence the server allows itself — 30 s to the model's
//   first byte, 20 s between fragments, then a save bounded by the
//   database's statement timeout — so it fires only on a connection that
//   died without closing. A phone that switches networks mid-letter leaves
//   exactly that: a socket that never errors, and a letter that would say
//   "writing" forever.
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
//   Yields the letter fragment by fragment, then `saving` once it is whole,
//   and RETURNS the saved application from the server's terminal `done`
//   event. A body that ends without it is a failure, never a short letter.
//
//   `signal` is the caller's Stop. The request itself runs on a connection
//   signal that also trips when the server goes quiet for too long, and a
//   trip that was not a Stop is reported as `interrupted`.
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
//   An AbortSignal that follows `parent` and also fires after `timeoutMs`
//   without a `reset`. Linked by hand rather than with AbortSignal.any,
//   which Safari only gained in 17.4 — on an older iPhone every letter
//   would fail on a TypeError before the request was even sent.
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
//   A reader loop instead of `for await` over the stream itself: async
//   iteration of a ReadableStream reached Safari late, and the e2e suite
//   runs Chromium only, so nothing would have caught it breaking there.
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
