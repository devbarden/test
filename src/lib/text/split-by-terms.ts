import { REGEXP_SPECIAL_CHARACTER } from './patterns'

type TextPart = { isMatch: boolean; start: number; text: string }

// ═══════════════════════════════════════════════════════════════════════════
//   One alternation of the terms, longest first so "market" wins over
//   "mark", in a capture group: String.split then keeps every match as an
//   odd-indexed part. Case-insensitive by Unicode case folding, so an
//   index in the result is an index in the original text.
// ═══════════════════════════════════════════════════════════════════════════
export function splitByTerms(text: string, terms: readonly string[]): TextPart[] {
	const unique = [...new Set(terms.map((term) => term.trim()))].filter(Boolean).sort((a, b) => b.length - a.length)

	if (unique.length === 0) return text ? [{ isMatch: false, start: 0, text }] : []

	const anyTerm = new RegExp(`(${unique.map(escapeRegExp).join('|')})`, 'giu')

	let start = 0

	return text
		.split(anyTerm)
		.map((part, index) => {
			const piece = { isMatch: index % 2 === 1, start, text: part }

			start += part.length

			return piece
		})
		.filter((part) => part.text !== '')
}

function escapeRegExp(term: string): string {
	return term.replace(REGEXP_SPECIAL_CHARACTER, '\\$&')
}
