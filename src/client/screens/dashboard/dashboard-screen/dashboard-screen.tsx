import { useQuery } from '@tanstack/react-query'
import { PlusIcon } from 'lucide-react'
import { applicationQueries } from '@/client/features/applications/api/application.queries'
import { GoalBanner } from '@/client/features/applications/ui/goal-banner'
import { ButtonLink } from '@/client/kit/button'
import { PageHeader } from '@/client/kit/page-header'
import { normalizeSearch } from '@/domain/applications/application-search'
import { ApplicationList } from '../application-list'
import { DashboardSearch } from '../dashboard-search'
import styles from './dashboard-screen.module.css'

type DashboardScreenProps = {
	onSearchChange: (search: string) => void
	search: string
}

export function DashboardScreen({ onSearchChange, search }: DashboardScreenProps) {
	const stats = useQuery(applicationQueries.stats())
	const canSearch = normalizeSearch(search) !== '' || (stats.data?.total ?? 0) > 0

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
			<ApplicationList onClearSearch={() => onSearchChange('')} search={search} />
			<GoalBanner />
		</div>
	)
}
