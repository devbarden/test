import {
	useInfiniteQuery,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query'
import clsx from 'clsx'
import { PlusIcon } from 'lucide-react'
import { useDeferredValue, ViewTransition } from 'react'
import { ConfirmDialog } from '@/components/dialogs/confirm-dialog'
import { PageHeader } from '@/components/layout/page-header'
import { Alert } from '@/components/ui/alert'
import { Button, ButtonLink } from '@/components/ui/button'
import { LoadError } from '@/components/ui/load-error'
import { applicationQueries } from '@/features/applications/api/application.queries'
import { useDeleteApplication } from '@/features/applications/hooks/use-delete-application'
import type { ApplicationDto } from '@/features/applications/model/application.schema'
import {
	normalizeSearch,
	searchTerms,
} from '@/features/applications/model/application-search'
import { applicationTitle } from '@/features/applications/model/application-title'
import { GoalBanner } from '@/features/applications/ui/goal-banner'
import { refreshUsage } from '@/features/billing/api/billing.cache'
import { useOnVisible } from '@/hooks/use-on-visible'
import { errorMessage } from '@/lib/api/api-error-message'
import { m } from '@/paraglide/messages'
import { ApplicationCard } from './application-card'
import { ApplicationCardSkeleton } from './application-card-skeleton'
import styles from './dashboard-screen.module.css'
import { DashboardSearch } from './dashboard-search'
import { EmptyState } from './empty-state'
import { NoMatches } from './no-matches'
import { useListFocus } from './use-list-focus'

const SKELETON_KEYS = ['first', 'second'] as const

const LOAD_AHEAD_MARGIN = '0px 0px 480px 0px'

// ═══════════════════════════════════════════════════════════════════════════
//   useSyncExternalStore renders synchronously and never animates, so the
//   list is deferred for <ViewTransition>.
// ═══════════════════════════════════════════════════════════════════════════
type DashboardScreenProps = {
	onSearchChange: (search: string) => void
	search: string
}

export function DashboardScreen({
	onSearchChange,
	search,
}: DashboardScreenProps) {
	const query = normalizeSearch(search)
	const applications = useInfiniteQuery(applicationQueries.list(query))
	const stats = useQuery(applicationQueries.stats())
	const items = useDeferredValue(
		applications.data?.pages.flatMap((page) => page.items),
	)
	const isLoadingMore = useDeferredValue(applications.isFetchingNextPage)
	const canLoadMore =
		applications.hasNextPage &&
		!applications.isFetchingNextPage &&
		!applications.isFetchNextPageError
	const loadMoreSentinel = useOnVisible(() => {
		void applications.fetchNextPage()
	}, LOAD_AHEAD_MARGIN)
	const terms = searchTerms(query)
	const canSearch = query !== '' || (stats.data?.total ?? 0) > 0
	const isSettledEmpty =
		items?.length === 0 &&
		!applications.hasNextPage &&
		!applications.isPlaceholderData
	const focus = useListFocus(items)
	const queryClient = useQueryClient()
	const deleteApplication = useDeleteApplication({
		onRestored: focus.afterRestoring,
		onSettled: () => refreshUsage(queryClient),
	})

	const handleDelete = async (application: ApplicationDto) => {
		const title =
			applicationTitle(application.input) ?? m['dashboard.card.untitled']()
		const confirmed = await ConfirmDialog.call({
			confirmLabel: m['dashboard.deleteDialog.confirm'](),
			message: m['dashboard.deleteDialog.description']({ title }),
			title: m['dashboard.deleteDialog.title'](),
			tone: 'danger',
		})

		if (!confirmed) return

		focus.afterRemoving(application)
		deleteApplication(application)
	}

	return (
		<div className={styles.root}>
			<PageHeader
				actions={
					<>
						{canSearch && (
							<DashboardSearch
								onSearchChange={onSearchChange}
								search={search}
							/>
						)}
						<ButtonLink
							iconStart={<PlusIcon />}
							size="md"
							to="/app/applications/create"
						>
							{m['dashboard.createNew']()}
						</ButtonLink>
					</>
				}
				title={m['dashboard.title']()}
			/>
			{applications.isError && !applications.data && (
				<LoadError onRetry={() => applications.refetch()}>
					{errorMessage(applications.error)}
				</LoadError>
			)}
			{!items && !applications.isError && (
				<ul
					aria-busy="true"
					aria-label={m['dashboard.loading']()}
					className={styles.grid}
				>
					{SKELETON_KEYS.map((key) => (
						<li key={key}>
							<ApplicationCardSkeleton />
						</li>
					))}
				</ul>
			)}
			{items && (
				<ul
					aria-busy={
						applications.isPlaceholderData || isLoadingMore || undefined
					}
					className={clsx(
						styles.grid,
						applications.isPlaceholderData && styles.stale,
					)}
				>
					{items.map((application) => (
						<ViewTransition enter="pop-in" exit="pop-out" key={application.id}>
							<li>
								<ApplicationCard
									application={application}
									highlight={terms}
									onDelete={handleDelete}
								/>
							</li>
						</ViewTransition>
					))}
					{isLoadingMore &&
						SKELETON_KEYS.map((key) => (
							<li aria-hidden="true" key={key}>
								<ApplicationCardSkeleton />
							</li>
						))}
				</ul>
			)}
			{isSettledEmpty &&
				(query ? (
					<NoMatches onClear={() => onSearchChange('')} search={search} />
				) : (
					<EmptyState />
				))}
			{canLoadMore && (
				<div
					aria-hidden="true"
					className={styles.sentinel}
					ref={loadMoreSentinel}
				/>
			)}
			{applications.isFetchNextPageError && (
				<div className={styles.more}>
					<Alert tone="danger">{errorMessage(applications.error)}</Alert>
					<Button
						onClick={() => applications.fetchNextPage()}
						variant="secondary"
					>
						{m['common.tryAgain']()}
					</Button>
				</div>
			)}
			<GoalBanner />
		</div>
	)
}
