import { SearchField } from '@/client/kit/search-field'
import { useMediaQuery } from '@/client/lib/hooks/use-media-query'
import { SEARCH_MAX_LENGTH } from '@/domain/applications/application-search'
import styles from './dashboard-search.module.css'
import { useSearchDraft } from './use-search-draft'

const PHONE_QUERY = '(width < 40rem)'

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
				name="search"
				onValueChange={changeDraft}
				placeholder={isPhone ? 'Search' : 'Search letters'}
				value={draft}
			/>
		</search>
	)
}
