import { WHITESPACE_RUN } from '@/lib/text/patterns'

export const SEARCH_MAX_LENGTH = 100

const MAX_SEARCH_TERMS = 6

type Searchable = {
	input: { company: string; jobTitle: string }
	letter: string
}

export function searchTerms(search: string): string[] {
	return search.toLowerCase().split(WHITESPACE_RUN).filter(Boolean).slice(0, MAX_SEARCH_TERMS)
}

export function normalizeSearch(search: string): string {
	return searchTerms(search).join(' ')
}

// ═══════════════════════════════════════════════════════════════════════════
//   The letter is searched too: a card shows only the letter, so a match
//   must be something the user can see highlighted. Mirrors the server.
// ═══════════════════════════════════════════════════════════════════════════
export function matchesSearch({ input, letter }: Searchable, search: string): boolean {
	const fields = [input.jobTitle, input.company, letter].map((field) => field.toLowerCase())

	return searchTerms(search).every((term) => fields.some((field) => field.includes(term)))
}
