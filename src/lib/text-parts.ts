export type TextPart = { isMatch: boolean; text: string }

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
