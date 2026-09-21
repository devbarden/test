import { PlusIcon } from 'lucide-react'
import { PageHeader } from '@/components/layout/page'
import { ButtonLink } from '@/components/ui/button'
import { useApplications, useDeleteApplication } from '@/features/applications'
import { GoalBanner } from '@/features/goal'
import { ApplicationCard } from './application-card'
import styles from './dashboard.module.css'
import { EmptyState } from './empty-state'

export function Dashboard() {
	const applications = useApplications()
	const deleteApplication = useDeleteApplication()

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
			{applications.length > 0 ? (
				<ul className={styles.grid}>
					{applications.map((application) => (
						<li key={application.id}>
							<ApplicationCard
								application={application}
								onDelete={deleteApplication}
							/>
						</li>
					))}
				</ul>
			) : (
				<EmptyState />
			)}
			<GoalBanner />
		</div>
	)
}
