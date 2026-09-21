import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { PlusIcon } from 'lucide-react'
import { useDeferredValue, ViewTransition } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Alert } from '@/components/ui/alert'
import { Button, ButtonLink } from '@/components/ui/button'
import { LoadError } from '@/components/ui/load-error'
import { applicationQueries } from '@/features/applications/api/application.queries'
import { useDeleteApplication } from '@/features/applications/hooks/use-delete-application'
import type { ApplicationDto } from '@/features/applications/model/application.schema'
import { GoalBanner } from '@/features/applications/ui/goal-banner'
import { refreshUsage } from '@/features/billing/api/billing.cache'
import { errorMessage } from '@/lib/api/api-error-message'
import { m } from '@/paraglide/messages'
import { ApplicationCard } from './application-card'
import { ApplicationCardSkeleton } from './application-card-skeleton'
import styles from './dashboard-screen.module.css'
import { EmptyState } from './empty-state'
import { useListFocus } from './use-list-focus'

const SKELETON_KEYS = ['first', 'second'] as const

// ═══════════════════════════════════════════════════════════════════════════
//   The cache updates through useSyncExternalStore, which React always
//   renders synchronously — and a synchronous render never animates. The
//   grid therefore renders a deferred copy of the list: the change commits
//   a moment later as a Transition, and <ViewTransition> animates it. A
//   deleted card fades out while its neighbours slide into the gap, and a
//   card brought back by Undo or loaded by "Show more" fades in.
//
//   The grid and the empty state both read that one deferred copy, so they
//   never disagree for a frame; the error and "Show more" follow the live
//   query, where a frame's delay would only make them late. The <ul> stays
//   mounted while it is empty: a card only animates its exit when it is
//   removed on its own, not together with the list around it.
// ═══════════════════════════════════════════════════════════════════════════
export function DashboardScreen() {
	const applications = useInfiniteQuery(applicationQueries.list())
	const items = useDeferredValue(
		applications.data?.pages.flatMap((page) => page.items),
	)
	const focus = useListFocus(items)
	const queryClient = useQueryClient()
	const deleteApplication = useDeleteApplication({
		onRestored: focus.afterRestoring,
		onSettled: () => refreshUsage(queryClient),
	})

	const handleDelete = (application: ApplicationDto) => {
		focus.afterRemoving(application)
		deleteApplication(application)
	}

	return (
		<div className={styles.root}>
			<PageHeader
				actions={
					<ButtonLink iconStart={<PlusIcon />} size="md" to="/applications/new">
						{m['dashboard.createNew']()}
					</ButtonLink>
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
				<ul className={styles.grid}>
					{items.map((application) => (
						<ViewTransition enter="pop-in" exit="pop-out" key={application.id}>
							<li>
								<ApplicationCard
									application={application}
									onDelete={handleDelete}
								/>
							</li>
						</ViewTransition>
					))}
				</ul>
			)}
			{items?.length === 0 && !applications.hasNextPage && <EmptyState />}
			{applications.hasNextPage && (
				<div className={styles.more}>
					{applications.isFetchNextPageError && (
						<Alert tone="danger">{errorMessage(applications.error)}</Alert>
					)}
					<Button
						loading={applications.isFetchingNextPage}
						onClick={() => applications.fetchNextPage()}
						variant="secondary"
					>
						{m['dashboard.showMore']()}
					</Button>
				</div>
			)}
			<GoalBanner />
		</div>
	)
}
