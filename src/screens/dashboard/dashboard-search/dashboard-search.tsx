import { SearchField } from '@/components/ui/search-field'
import { SEARCH_MAX_LENGTH } from '@/domain/applications/application-search'
import { useMediaQuery } from '@/hooks/use-media-query'
import { PHONE_QUERY } from '@/styles/breakpoints'
import styles from './dashboard-search.module.css'
import { useSearchDraft } from './use-search-draft'

type DashboardSearchProps = {
	onSearchChange: (search: string) => void
	search: string
}

export function DashboardSearch({ onSearchChange, search }: DashboardSearchProps) {
	const [draft, changeDraft] = useSearchDraft(search, onSearchChange)
	const isPhone = useMediaQuery(PHONE_QUERY)

	return (
		<search className={styles.root}>
			<SearchField
				clearLabel="Clear search"
				label="Search applications"
				maxLength={SEARCH_MAX_LENGTH}
				onValueChange={changeDraft}
				placeholder={isPhone ? 'Search' : 'Search letters'}
				value={draft}
			/>
		</search>
	)
}
