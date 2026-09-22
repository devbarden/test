import { ChevronDownIcon } from 'lucide-react'
import { Alert } from '@/client/kit/alert'
import { Button } from '@/client/kit/button'
import { LoadError } from '@/client/kit/load-error'
import { normalizeSearch, searchTerms } from '@/domain/applications/application-search'
import { errorMessage } from '@/lib/api/api-error-message'
import { ApplicationGrid } from '../application-grid'
import { EmptyState } from '../empty-state'
import { NoMatches } from '../no-matches'
import styles from './application-list.module.css'
import { useApplicationList } from './use-application-list'
import { useConfirmedDelete } from './use-confirmed-delete'

type ApplicationListProps = {
	onClearSearch: () => void
	search: string
}

// ═══════════════════════════════════════════════════════════════════════════
//   A fragment: its parts are spaced by the screen's column, which the
//   load-more footer pulls itself into.
// ═══════════════════════════════════════════════════════════════════════════
export function ApplicationList({ onClearSearch, search }: ApplicationListProps) {
	const query = normalizeSearch(search)
	const list = useApplicationList(query)
	const handleDelete = useConfirmedDelete(list.items)

	return (
		<>
			{list.failedToLoad ? (
				<LoadError onRetry={list.retry}>{errorMessage(list.error)}</LoadError>
			) : (
				<ApplicationGrid
					appendedFrom={list.appendedFrom}
					highlight={searchTerms(query)}
					isLoadingMore={list.isLoadingMore}
					isStale={list.isStale}
					items={list.items}
					onDelete={handleDelete}
				/>
			)}
			{list.isEmpty && (query ? <NoMatches onClear={onClearSearch} search={search} /> : <EmptyState />)}
			{list.hasMore && (
				<div className={styles.more}>
					{list.failedToLoadMore && <Alert tone="danger">{errorMessage(list.error)}</Alert>}
					<Button
						iconStart={<ChevronDownIcon />}
						loading={list.isLoadingMore}
						onClick={list.loadMore}
						shape="pill"
						size="md"
						variant="secondary"
					>
						{list.failedToLoadMore ? 'Try again' : 'Load more'}
					</Button>
				</div>
			)}
			<p className="visually-hidden" role="status">
				{loadingStatus(list)}
			</p>
		</>
	)
}

// ═══════════════════════════════════════════════════════════════════════════
//   The button vanishes with the last page, so a screen reader is told
//   that the list is complete instead of losing the control it was on.
// ═══════════════════════════════════════════════════════════════════════════
function loadingStatus({ hasLoadedEverything, isLoadingMore }: ReturnType<typeof useApplicationList>): string {
	if (isLoadingMore) return 'Loading more applications…'
	if (hasLoadedEverything) return 'All applications are shown'

	return ''
}
