import { useQuery } from '@tanstack/react-query'
import { PlusIcon } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Alert } from '@/components/ui/alert'
import { Button, ButtonLink } from '@/components/ui/button'
import { LoadError } from '@/components/ui/load-error'
import { normalizeSearch, searchTerms } from '@/domain/applications/application-search'
import { applicationQueries } from '@/features/applications/api/application.queries'
import { GoalBanner } from '@/features/applications/ui/goal-banner'
import { errorMessage } from '@/lib/api/api-error-message'
import { ApplicationGrid } from './application-grid/application-grid'
import styles from './dashboard-screen.module.css'
import { DashboardSearch } from './dashboard-search/dashboard-search'
import { EmptyState } from './empty-state/empty-state'
import { NoMatches } from './no-matches/no-matches'
import { useApplicationList } from './use-application-list'
import { useConfirmedDelete } from './use-confirmed-delete'

type DashboardScreenProps = {
	onSearchChange: (search: string) => void
	search: string
}

export function DashboardScreen({ onSearchChange, search }: DashboardScreenProps) {
	const query = normalizeSearch(search)
	const list = useApplicationList(query)
	const stats = useQuery(applicationQueries.stats())
	const handleDelete = useConfirmedDelete(list.items)
	const canSearch = query !== '' || (stats.data?.total ?? 0) > 0

	return (
		<div className={styles.root}>
			<PageHeader
				actions={
					<>
						{canSearch && <DashboardSearch onSearchChange={onSearchChange} search={search} />}
						<ButtonLink iconStart={<PlusIcon />} size="md" to="/app/applications/create">
							Create New
						</ButtonLink>
					</>
				}
				title="Applications"
			/>
			{list.failedToLoad ? (
				<LoadError onRetry={list.retry}>{errorMessage(list.error)}</LoadError>
			) : (
				<ApplicationGrid
					highlight={searchTerms(query)}
					isLoadingMore={list.isLoadingMore}
					isStale={list.isStale}
					items={list.items}
					onDelete={handleDelete}
				/>
			)}
			{list.isEmpty && (query ? <NoMatches onClear={() => onSearchChange('')} search={search} /> : <EmptyState />)}
			{list.canLoadMore && <div aria-hidden="true" className={styles.sentinel} ref={list.observeSentinel} />}
			<p className="visually-hidden" role="status">
				{loadingStatus(list)}
			</p>
			{list.failedToLoadMore && (
				<div className={styles.more}>
					<Alert tone="danger">{errorMessage(list.error)}</Alert>
					<Button onClick={list.loadMore} variant="secondary">
						Try again
					</Button>
				</div>
			)}
			<GoalBanner />
		</div>
	)
}

// ═══════════════════════════════════════════════════════════════════════════
//   Pages arrive below the fold without a click: a screen reader hears
//   that more is coming and when the list is complete.
// ═══════════════════════════════════════════════════════════════════════════
function loadingStatus({ hasLoadedEverything, isLoadingMore }: ReturnType<typeof useApplicationList>): string {
	if (isLoadingMore) return 'Loading more applications…'
	if (hasLoadedEverything) return 'All applications are shown'

	return ''
}
