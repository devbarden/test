import { PARAGRAPH_BREAK } from './patterns'

export type Paragraph = { start: number; text: string }

// ═══════════════════════════════════════════════════════════════════════════
//   Each paragraph carries the offset it starts at, a key that survives
//   while text is appended after it.
// ═══════════════════════════════════════════════════════════════════════════
export function splitParagraphs(text: string): Paragraph[] {
	const body = text.trim()
	const paragraphs: Paragraph[] = []
	let start = 0

	for (const separator of body.matchAll(PARAGRAPH_BREAK)) {
		paragraphs.push({ start, text: body.slice(start, separator.index) })
		start = separator.index + separator[0].length
	}

	paragraphs.push({ start, text: body.slice(start) })

	return paragraphs
}

export function collapseParagraphs(text: string): string {
	return splitParagraphs(text)
		.map((paragraph) => paragraph.text)
		.join('\n')
}
