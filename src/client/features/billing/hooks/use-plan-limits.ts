import { useQuery } from '@tanstack/react-query'
import { FULL_ENTITLEMENTS } from '@/domain/billing/billing-entitlements'
import { hoursUntilReset } from '@/domain/billing/billing-usage-reset'
import { billingQueries } from '../api/billing.queries'
import { type PlanLimit, PlanLimitDialog } from '../ui/plan-limit-dialog'
import { useEntitlements } from './use-entitlements'

const DAY_IN_HOURS = 24

const LIMITED_ENTITLEMENT = {
	daily: 'dailyGenerations',
	saved: 'maxApplications',
} as const satisfies Record<PlanLimit, string>

export function usePlanLimits() {
	const { data, dataUpdatedAt } = useQuery(billingQueries.overview())
	const { entitlements, plan } = useEntitlements()
	const isFree = plan === 'free'

	// ═════════════════════════════════════════════════════════════════════════
	//   The usage may be hours old on a tab left open: count down from when
	//   it was fetched, so a window that has reset no longer blocks.
	// ═════════════════════════════════════════════════════════════════════════
	const resetSecondsLeft = () => data && data.usage.generationsResetInSeconds - (Date.now() - dataUpdatedAt) / 1000

	const reached = ({ creates }: { creates: boolean }): PlanLimit | undefined => {
		if (!data) return undefined

		const { entitlements: limits, usage } = data
		const isDailyUsedUp = usage.generationsInWindow >= limits.dailyGenerations && (resetSecondsLeft() ?? 0) > 0

		if (isDailyUsedUp) return 'daily'
		if (creates && usage.applications >= limits.maxApplications) return 'saved'

		return undefined
	}

	const explain = (reason: PlanLimit, retryAfterSeconds?: number) => {
		const resetSeconds = retryAfterSeconds ?? resetSecondsLeft()
		const entitlement = LIMITED_ENTITLEMENT[reason]

		PlanLimitDialog.call({
			hoursUntilReset: resetSeconds === undefined ? DAY_IN_HOURS : hoursUntilReset(resetSeconds),
			limit: entitlements[entitlement],
			reason,
			upgradeLimit: isFree ? FULL_ENTITLEMENTS[entitlement] : undefined,
		})
	}

	return { explain, reached }
}
