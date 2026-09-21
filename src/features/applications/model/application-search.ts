export const SEARCH_MAX_LENGTH = 100

const MAX_SEARCH_TERMS = 6

type Searchable = { company: string; jobTitle: string }

// ═══════════════════════════════════════════════════════════════════════════
//   A search is a handful of words, and a letter matches when every word
//   appears in its job title or its company, in any case and any order:
//   "apple manager" finds "Product manager, Apple". The server runs the
//   same rule in SQL (application.repository.server.ts); this copy lets the
//   client keep a filtered list right when it inserts or edits a letter in
//   the cache, without asking the server again.
// ═══════════════════════════════════════════════════════════════════════════
export function searchTerms(search: string): string[] {
	return search
		.toLowerCase()
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, MAX_SEARCH_TERMS)
}

export function normalizeSearch(search: string): string {
	return searchTerms(search).join(' ')
}

export function matchesSearch(
	{ company, jobTitle }: Searchable,
	search: string,
): boolean {
	const fields = [jobTitle.toLowerCase(), company.toLowerCase()]

	return searchTerms(search).every((term) =>
		fields.some((field) => field.includes(term)),
	)
}
