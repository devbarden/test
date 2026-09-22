import type { GenerationEvent } from '@/domain/generation/generation.schema'
import { tidyWhitespace, toPlainText } from '@/lib/text/plain-text'
import { UpstreamError } from '@/server/errors/app-error.server'

export type RelayedLetter = {
	firstTokenMs: number
	text: string
}

// ═══════════════════════════════════════════════════════════════════════════
//   A provider that ignores its token limit or answers with nothing is as
//   broken as one that hangs up, so both end the run as `interrupted`.
// ═══════════════════════════════════════════════════════════════════════════
export async function* relayLetter(
	deltas: AsyncIterable<string>,
	maxCharacters: number,
): AsyncGenerator<GenerationEvent, RelayedLetter> {
	const startedAt = performance.now()
	let letter = ''
	let firstTokenMs = 0

	for await (const fragment of deltas) {
		const text = toPlainText(fragment)

		if (!letter) firstTokenMs = Math.round(performance.now() - startedAt)

		letter += text

		if (letter.length > maxCharacters) {
			throw new UpstreamError('interrupted', `Generation API exceeded ${maxCharacters} characters`)
		}

		if (text) yield { text, type: 'delta' }
	}

	const text = tidyWhitespace(letter)

	if (!text) throw new UpstreamError('interrupted', 'Generation API finished without any text')

	return { firstTokenMs, text }
}
