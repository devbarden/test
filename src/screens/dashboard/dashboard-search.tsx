import { useEffect, useState } from 'react'
import { SearchField } from '@/components/ui/search-field'
import {
	normalizeSearch,
	SEARCH_MAX_LENGTH,
} from '@/features/applications/model/application-search'
import { useMediaQuery } from '@/hooks/use-media-query'
import { PHONE_QUERY } from '@/lib/breakpoints'
import { m } from '@/paraglide/messages'
import styles from './dashboard-screen.module.css'

const SEARCH_DEBOUNCE_MS = 250

type DashboardSearchProps = {
	onSearchChange: (search: string) => void
	search: string
}

// ═══════════════════════════════════════════════════════════════════════════
//   Back/Forward sync the field from the URL unless it already matches, so
//   typing is never overwritten.
// ═══════════════════════════════════════════════════════════════════════════
export function DashboardSearch({
	onSearchChange,
	search,
}: DashboardSearchProps) {
	const [draft, setDraft] = useState(search)
	const isPhone = useMediaQuery(PHONE_QUERY)
	const [shownSearch, setShownSearch] = useState(search)

	if (search !== shownSearch) {
		setShownSearch(search)
		if (normalizeSearch(draft) !== normalizeSearch(search)) setDraft(search)
	}

	useEffect(() => {
		if (normalizeSearch(draft) === normalizeSearch(search)) return

		const timer = window.setTimeout(
			() => onSearchChange(draft.trim()),
			SEARCH_DEBOUNCE_MS,
		)

		return () => window.clearTimeout(timer)
	}, [draft, onSearchChange, search])

	const handleChange = (value: string) => {
		setDraft(value)
		if (!value) onSearchChange('')
	}

	return (
		<search className={styles.search}>
			<SearchField
				clearLabel={m['dashboard.search.clear']()}
				label={m['dashboard.search.label']()}
				maxLength={SEARCH_MAX_LENGTH}
				onValueChange={handleChange}
				placeholder={
					isPhone
						? m['dashboard.search.placeholderShort']()
						: m['dashboard.search.placeholder']()
				}
				value={draft}
			/>
		</search>
	)
}
