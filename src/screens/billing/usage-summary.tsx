import { useQuery } from '@tanstack/react-query'
import { Heading } from '@/components/ui/heading'
import { LoadError } from '@/components/ui/load-error'
import { Meter } from '@/components/ui/meter'
import { Panel } from '@/components/ui/panel'
import { Skeleton } from '@/components/ui/skeleton'
import { hoursUntilReset } from '@/domain/billing/usage-reset'
import { billingQueries } from '@/features/billing/api/billing.queries'
import { PLAN_NAMES } from './plan-copy'
import styles from './usage-summary.module.css'

export function UsageSummary() {
	const overview = useQuery(billingQueries.overview())

	if (!overview.data) {
		return overview.isError ? (
			<LoadError onRetry={() => overview.refetch()}>
				Could not load your usage.
			</LoadError>
		) : (
			<Skeleton className={styles.skeleton} shape="block" />
		)
	}

	const { entitlements, plan, usage } = overview.data

	return (
		<Panel className={styles.root}>
			<Heading size="sm">{`You are on the ${PLAN_NAMES[plan]} plan`}</Heading>
			<Meter
				label="Letters today"
				max={entitlements.dailyGenerations}
				value={usage.generationsToday}
			/>
			{usage.generationsToday > 0 && (
				<p className={styles.reset}>
					{`Limit resets in ${hoursUntilReset(usage.generationsResetInSeconds)} h`}
				</p>
			)}
			<Meter
				label="Saved applications"
				max={entitlements.maxApplications}
				value={usage.applications}
			/>
		</Panel>
	)
}
