import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/page-header'
import { LoadError } from '@/components/ui/load-error'
import { Skeleton } from '@/components/ui/skeleton'
import { billingQueries } from '@/features/billing/api/billing.queries'
import { m } from '@/paraglide/messages'
import styles from './billing-screen.module.css'
import { PlanPicker } from './plan-picker'
import { UsageSummary } from './usage-summary'

export function BillingScreen() {
	const overview = useQuery(billingQueries.overview())

	return (
		<div className={styles.root}>
			<PageHeader title={m['billing.title']()} />
			{overview.data ? (
				<UsageSummary overview={overview.data} />
			) : overview.isError ? (
				<LoadError onRetry={() => overview.refetch()}>
					{m['billing.loadFailed']()}
				</LoadError>
			) : (
				<Skeleton className={styles.skeleton} shape="block" />
			)}
			<PlanPicker currentPlan={overview.data?.plan} />
		</div>
	)
}
