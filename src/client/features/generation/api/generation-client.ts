import type { ApplicationDto } from '@/domain/applications/application.schema'
import {
	type GenerateCommand,
	type GenerationEvent,
	generationEventSchema,
} from '@/domain/generation/generation.schema'
import { readApiErrorResponse } from '@/lib/api/api-error'
import { type ByteStream, readNdjson } from '@/lib/api/ndjson'
import { createIdleAbort } from './idle-abort'
import { LetterGenerationFailure } from './letter-generation-failure'

const GENERATION_ENDPOINT = '/api/generate'

// ═══════════════════════════════════════════════════════════════════════════
//   Longer than any silence the server allows itself: only a dead socket
//   trips it.
// ═══════════════════════════════════════════════════════════════════════════
const IDLE_TIMEOUT_MS = 60_000

type LetterEvent = Extract<GenerationEvent, { type: 'delta' | 'saving' }>

// ═══════════════════════════════════════════════════════════════════════════
//   Yields the letter as it is written and returns it once saved. Any
//   other ending is a LetterGenerationFailure: a body that stops without
//   `done` is a cut-off letter, never a short one. A Stop is rethrown as
//   the abort itself.
// ═══════════════════════════════════════════════════════════════════════════
export async function* requestLetter(
	command: GenerateCommand,
	signal: AbortSignal,
): AsyncGenerator<LetterEvent, ApplicationDto> {
	const connection = createIdleAbort(signal, IDLE_TIMEOUT_MS)

	try {
		const body = await openLetterStream(command, connection.signal)

		for await (const event of readNdjson(body, generationEventSchema)) {
			connection.restart()

			if (event.type === 'done') return event.application
			if (event.type === 'error') throw new LetterGenerationFailure(event.error)

			yield event
		}

		throw new LetterGenerationFailure({ code: 'interrupted' })
	} catch (cause) {
		if (signal.aborted || cause instanceof LetterGenerationFailure) throw cause

		throw new LetterGenerationFailure({ code: 'interrupted' })
	} finally {
		connection.stop()
	}
}

// ═══════════════════════════════════════════════════════════════════════════
//   Everything that can go wrong before the first byte is named here: no
//   connection is `network`, a refusal is the server's own error. What
//   breaks after this point is the stream, reported by the caller.
// ═══════════════════════════════════════════════════════════════════════════
async function openLetterStream(command: GenerateCommand, signal: AbortSignal): Promise<ByteStream> {
	const response = await fetch(GENERATION_ENDPOINT, {
		body: JSON.stringify(command),
		headers: { 'Content-Type': 'application/json' },
		method: 'POST',
		signal,
	}).catch((cause: unknown) => {
		if (signal.aborted) throw cause

		throw new LetterGenerationFailure({ code: 'network' })
	})

	if (!response.ok || !response.body) throw new LetterGenerationFailure(await readApiErrorResponse(response))

	return response.body
}
