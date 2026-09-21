import { useInfiniteQuery } from '@tanstack/react-query'
import { PlusIcon } from 'lucide-react'
import { PageHeader } from '@/components/layout/page'
import { Alert } from '@/components/ui/alert'
import { Button, ButtonLink } from '@/components/ui/button'
import {
	applicationQueries,
	useDeleteApplication,
} from '@/features/applications'
import { GoalBanner } from '@/features/goal'
import { readApiError } from '@/lib/api-error'
import { apiErrorMessage } from '@/lib/api-error-message'
import { ApplicationCard } from './application-card'
import { ApplicationCardSkeleton } from './application-card-skeleton'
import styles from './dashboard.module.css'
import { EmptyState } from './empty-state'

const SKELETON_KEYS = ['first', 'second'] as const

export function Dashboard() {
	const applications = useInfiniteQuery(applicationQueries.list())
	const deleteApplication = useDeleteApplication()
	const items = applications.data?.pages.flatMap((page) => page.items) ?? []

	return (
		<div className={styles.dashboard}>
			<PageHeader
				actions={
					<ButtonLink iconStart={<PlusIcon />} to="/applications/new">
						Create New
					</ButtonLink>
				}
				title="Applications"
			/>
			{applications.isError && !applications.data && (
				<div className={styles.error}>
					<Alert tone="danger">
						{apiErrorMessage(readApiError(applications.error))}
					</Alert>
					<Button onClick={() => applications.refetch()} variant="secondary">
						Try again
					</Button>
				</div>
			)}
			{applications.isPending && (
				<ul
					aria-busy="true"
					aria-label="Loading applications"
					className={styles.grid}
				>
					{SKELETON_KEYS.map((key) => (
						<li key={key}>
							<ApplicationCardSkeleton />
						</li>
					))}
				</ul>
			)}
			{applications.isSuccess && items.length === 0 && <EmptyState />}
			{items.length > 0 && (
				<ul className={styles.grid}>
					{items.map((application) => (
						<li key={application.id}>
							<ApplicationCard
								application={application}
								onDelete={deleteApplication}
							/>
						</li>
					))}
				</ul>
			)}
			{applications.hasNextPage && (
				<Button
					className={styles.more}
					loading={applications.isFetchingNextPage}
					onClick={() => applications.fetchNextPage()}
					variant="secondary"
				>
					Show more
				</Button>
			)}
			<GoalBanner />
		</div>
	)
}
