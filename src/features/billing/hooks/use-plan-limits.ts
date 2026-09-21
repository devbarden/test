import { useQuery } from '@tanstack/react-query'
import { FULL_ENTITLEMENTS } from '@/domain/billing/billing.catalog'
import { hoursUntilReset } from '@/domain/billing/usage-reset'
import { billingQueries } from '../api/billing.queries'
import { type PlanLimit, PlanLimitDialog } from '../ui/plan-limit-dialog'
import { useEntitlements } from './use-entitlements'

const DAY_IN_HOURS = 24

const LIMITED_ENTITLEMENT = {
	daily: 'dailyGenerations',
	saved: 'maxApplications',
} as const satisfies Record<PlanLimit, string>

export function usePlanLimits() {
	const { data } = useQuery(billingQueries.overview())
	const { entitlements, plan } = useEntitlements()
	const isFree = plan === 'free'

	const reached = ({
		creates,
	}: {
		creates: boolean
	}): PlanLimit | undefined => {
		if (!data) return undefined
		if (data.usage.generationsToday >= data.entitlements.dailyGenerations) {
			return 'daily'
		}
		if (
			creates &&
			data.usage.applications >= data.entitlements.maxApplications
		) {
			return 'saved'
		}
		return undefined
	}

	const explain = (reason: PlanLimit, retryAfterSeconds?: number) => {
		const resetSeconds =
			retryAfterSeconds ?? data?.usage.generationsResetInSeconds
		const entitlement = LIMITED_ENTITLEMENT[reason]

		void PlanLimitDialog.call({
			hoursUntilReset:
				resetSeconds === undefined
					? DAY_IN_HOURS
					: hoursUntilReset(resetSeconds),
			limit: entitlements[entitlement],
			reason,
			upgradeLimit: isFree ? FULL_ENTITLEMENTS[entitlement] : undefined,
		})
	}

	return { explain, reached }
}
