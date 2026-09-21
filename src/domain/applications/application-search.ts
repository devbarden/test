export const SEARCH_MAX_LENGTH = 100

const MAX_SEARCH_TERMS = 6

type Searchable = { company: string; jobTitle: string }

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
