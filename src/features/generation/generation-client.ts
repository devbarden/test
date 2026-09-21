import type { ApplicationDto } from '@/features/applications/application.schema'
import { type ApiError, apiErrorBodySchema } from '@/lib/api-error'
import { createLineSplitter } from './line-splitter'
import {
	GENERATION_ENDPOINT,
	type GenerateCommand,
	generationEventSchema,
} from './protocol'

export class LetterGenerationFailure extends Error {
	readonly error: ApiError

	constructor(error: ApiError) {
		super(`Letter generation failed: ${error.code}`)
		this.name = 'LetterGenerationFailure'
		this.error = error
	}
}

// ═══════════════════════════════════════════════════════════════════════════
//   Yields the letter fragment by fragment and RETURNS the saved application
//   from the server's terminal `done` event. A body that ends without it is
//   a failure, never a short letter.
// ═══════════════════════════════════════════════════════════════════════════
export async function* requestLetter(
	command: GenerateCommand,
	signal: AbortSignal,
): AsyncGenerator<string, ApplicationDto> {
	const response = await postCommand(command, signal)

	if (!response.ok || !response.body) throw await failureFromResponse(response)

	const lines = response.body
		.pipeThrough(new TextDecoderStream())
		.pipeThrough(createLineSplitter())

	try {
		for await (const line of lines) {
			const event = generationEventSchema.parse(JSON.parse(line))

			if (event.type === 'delta') yield event.text
			if (event.type === 'error') throw new LetterGenerationFailure(event.error)
			if (event.type === 'done') return event.application
		}
	} catch (cause) {
		if (cause instanceof LetterGenerationFailure || signal.aborted) throw cause

		throw new LetterGenerationFailure({ code: 'interrupted' })
	}

	throw new LetterGenerationFailure({ code: 'interrupted' })
}

async function postCommand(
	command: GenerateCommand,
	signal: AbortSignal,
): Promise<Response> {
	try {
		return await fetch(GENERATION_ENDPOINT, {
			body: JSON.stringify(command),
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
	const body = apiErrorBodySchema.safeParse(
		await response.json().catch(() => null),
	)

	if (body.success) return new LetterGenerationFailure(body.data.error)

	return new LetterGenerationFailure({
		code: response.status === 401 ? 'unauthorized' : 'unavailable',
	})
}
