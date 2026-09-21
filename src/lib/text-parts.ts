export type TextPart = { isMatch: boolean; text: string }

// ═══════════════════════════════════════════════════════════════════════════
//   Splits text into runs that do and do not match any of the terms, in
//   order, case-insensitively, for rendering matches as <mark> — plain
//   text nodes, never HTML, so a letter cannot inject markup. Longer terms
//   are tried first, so "manager" wins over "man" where both would match,
//   and the terms are escaped, so "c++" or "(pm)" are searched literally.
// ═══════════════════════════════════════════════════════════════════════════
export function splitByTerms(
	text: string,
	terms: readonly string[],
): TextPart[] {
	const unique = [...new Set(terms.map((term) => term.trim()))]
		.filter(Boolean)
		.sort((a, b) => b.length - a.length)

	if (unique.length === 0) return text ? [{ isMatch: false, text }] : []

	const pattern = new RegExp(`(${unique.map(escapeRegExp).join('|')})`, 'giu')

	return text
		.split(pattern)
		.map((part, index) => ({ isMatch: index % 2 === 1, text: part }))
		.filter((part) => part.text !== '')
}

function escapeRegExp(term: string): string {
	return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
