import { Heading } from '@/components/ui/heading'
import { Meter } from '@/components/ui/meter'
import { Panel } from '@/components/ui/panel'
import type { BillingOverview } from '@/features/billing/model/billing-overview'
import { m } from '@/paraglide/messages'
import { PLAN_NAMES } from './plan-copy'
import styles from './usage-summary.module.css'

const SECONDS_PER_HOUR = 3600

type UsageSummaryProps = {
	overview: BillingOverview
}

export function UsageSummary({ overview }: UsageSummaryProps) {
	const { entitlements, plan, usage } = overview
	const resetInHours = Math.max(
		1,
		Math.ceil(usage.generationsResetInSeconds / SECONDS_PER_HOUR),
	)

	return (
		<Panel className={styles.root}>
			<Heading size="sm">
				{m['billing.currentPlan']({ plan: PLAN_NAMES[plan]() })}
			</Heading>
			<Meter
				label={m['billing.lettersToday']()}
				max={entitlements.dailyGenerations}
				value={usage.generationsToday}
				valueText={m['billing.usageValue']({
					limit: entitlements.dailyGenerations,
					used: usage.generationsToday,
				})}
			/>
			{usage.generationsToday > 0 && (
				<p className={styles.reset}>
					{m['billing.resetsIn']({ hours: resetInHours })}
				</p>
			)}
			<Meter
				label={m['billing.savedApplications']()}
				max={entitlements.maxApplications}
				value={usage.applications}
				valueText={m['billing.usageValue']({
					limit: entitlements.maxApplications,
					used: usage.applications,
				})}
			/>
		</Panel>
	)
}
