import { useEffect, useState } from 'react'
import { normalizeSearch } from '@/domain/applications/application-search'

const SEARCH_DEBOUNCE_MS = 250

// ═══════════════════════════════════════════════════════════════════════════
//   What the field shows, sent to the URL after a pause. Back/Forward sync
//   the field from the URL unless it already matches, so typing is never
//   overwritten; clearing the field applies at once.
// ═══════════════════════════════════════════════════════════════════════════
export function useSearchDraft(search: string, onSearchChange: (search: string) => void) {
	const [draft, setDraft] = useState(search)
	const [shownSearch, setShownSearch] = useState(search)

	if (search !== shownSearch) {
		setShownSearch(search)
		if (normalizeSearch(draft) !== normalizeSearch(search)) setDraft(search)
	}

	useEffect(() => {
		if (normalizeSearch(draft) === normalizeSearch(search)) return

		const timer = window.setTimeout(() => onSearchChange(draft.trim()), SEARCH_DEBOUNCE_MS)

		return () => window.clearTimeout(timer)
	}, [draft, onSearchChange, search])

	const changeDraft = (value: string) => {
		setDraft(value)
		if (!value) onSearchChange('')
	}

	return [draft, changeDraft] as const
}
