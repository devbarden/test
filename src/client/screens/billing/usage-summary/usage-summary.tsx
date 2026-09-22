import { useQuery } from '@tanstack/react-query'
import { billingQueries } from '@/client/features/billing/api/billing.queries'
import { Heading } from '@/client/kit/heading'
import { LoadError } from '@/client/kit/load-error'
import { Meter } from '@/client/kit/meter'
import { Panel } from '@/client/kit/panel'
import { Skeleton } from '@/client/kit/skeleton'
import { hoursUntilReset } from '@/domain/billing/billing-usage-reset'
import { PLAN_NAMES } from '../plan-copy'
import styles from './usage-summary.module.css'

export function UsageSummary() {
	const overview = useQuery(billingQueries.overview())

	if (!overview.data) {
		return overview.isError ? (
			<LoadError onRetry={() => overview.refetch()}>Could not load your usage.</LoadError>
		) : (
			<Skeleton className={styles.skeleton} shape="block" />
		)
	}

	const { entitlements, plan, usage } = overview.data

	return (
		<Panel className={styles.root}>
			<Heading size="sm">{`You are on the ${PLAN_NAMES[plan]} plan`}</Heading>
			<Meter
				label="Letters in the last 24 hours"
				max={entitlements.dailyGenerations}
				value={usage.generationsInWindow}
			/>
			{usage.generationsInWindow > 0 && (
				<p className={styles.reset}>{`Limit resets in ${hoursUntilReset(usage.generationsResetInSeconds)} h`}</p>
			)}
			<Meter label="Saved applications" max={entitlements.maxApplications} value={usage.applications} />
		</Panel>
	)
}
