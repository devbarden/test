import type { ApplicationInput } from '@/features/applications'
import { createLineSplitter } from './line-splitter'
import {
	GENERATION_ENDPOINT,
	type GenerationError,
	generationErrorBodySchema,
	generationEventSchema,
} from './protocol'

// ═══════════════════════════════════════════════════════════════════════════
//   Two failures only the browser can see are added to the server's codes:
//   `network` (the request never reached us — offline, DNS, a dropped
//   Wi-Fi) and `not_saved` (the letter arrived but storage refused it).
// ═══════════════════════════════════════════════════════════════════════════
export type LetterGenerationError =
	| GenerationError
	| { code: 'network' }
	| { code: 'not_saved' }

export class LetterGenerationFailure extends Error {
	readonly error: LetterGenerationError

	constructor(error: LetterGenerationError) {
		super(`Letter generation failed: ${error.code}`)
		this.name = 'LetterGenerationFailure'
		this.error = error
	}
}

// ═══════════════════════════════════════════════════════════════════════════
//   Yields the letter fragment by fragment and returns only after the
//   server's explicit `done`. A body that ends without it is a failure, not
//   a short letter: that is the guarantee the caller relies on before it
//   saves anything.
// ═══════════════════════════════════════════════════════════════════════════
export async function* requestLetter(
	input: ApplicationInput,
	signal: AbortSignal,
): AsyncGenerator<string> {
	const response = await postGenerationRequest(input, signal)

	if (!response.ok || !response.body) throw await failureFromResponse(response)

	const lines = response.body
		.pipeThrough(new TextDecoderStream())
		.pipeThrough(createLineSplitter())

	try {
		for await (const line of lines) {
			const event = generationEventSchema.parse(JSON.parse(line))

			if (event.type === 'delta') yield event.text
			if (event.type === 'error') throw new LetterGenerationFailure(event.error)
			if (event.type === 'done') return
		}
	} catch (cause) {
		if (cause instanceof LetterGenerationFailure || signal.aborted) throw cause

		throw new LetterGenerationFailure({ code: 'interrupted' })
	}

	throw new LetterGenerationFailure({ code: 'interrupted' })
}

async function postGenerationRequest(
	input: ApplicationInput,
	signal: AbortSignal,
): Promise<Response> {
	try {
		return await fetch(GENERATION_ENDPOINT, {
			body: JSON.stringify(input),
			headers: { 'Content-Type': 'application/json' },
			method: 'POST',
			signal,
		})
	} catch (cause) {
		if (signal.aborted) throw cause

		throw new LetterGenerationFailure({ code: 'network' })
	}
}

async function failureFromResponse(
	response: Response,
): Promise<LetterGenerationFailure> {
	const body = generationErrorBodySchema.safeParse(
		await response.json().catch(() => null),
	)

	if (body.success) return new LetterGenerationFailure(body.data.error)

	return new LetterGenerationFailure({
		code: response.status === 401 ? 'unauthorized' : 'unavailable',
	})
}
