type TextPart = { isMatch: boolean; start: number; text: string }

export function splitByTerms(text: string, terms: readonly string[]): TextPart[] {
	const unique = [...new Set(terms.map((term) => term.trim()))].filter(Boolean).sort((a, b) => b.length - a.length)

	if (unique.length === 0) return text ? [{ isMatch: false, start: 0, text }] : []

	const pattern = new RegExp(`(${unique.map(escapeRegExp).join('|')})`, 'giu')

	let start = 0

	return text
		.split(pattern)
		.map((part, index) => {
			const piece = { isMatch: index % 2 === 1, start, text: part }

			start += part.length

			return piece
		})
		.filter((part) => part.text !== '')
}

function escapeRegExp(term: string): string {
	return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
