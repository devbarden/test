import { useQuery } from '@tanstack/react-query'
import { billingQueries } from '../api/billing.queries'
import { FULL_ENTITLEMENTS } from '../model/billing.catalog'
import { type PlanLimit, PlanLimitDialog } from '../ui/plan-limit-dialog'
import { useEntitlements } from './use-entitlements'

const SECONDS_PER_HOUR = 3600
const DAY_IN_HOURS = 24

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
		const hoursUntilReset =
			resetSeconds === undefined
				? DAY_IN_HOURS
				: Math.max(1, Math.ceil(resetSeconds / SECONDS_PER_HOUR))

		void PlanLimitDialog.call({
			hoursUntilReset,
			limit:
				reason === 'daily'
					? entitlements.dailyGenerations
					: entitlements.maxApplications,
			reason,
			upgradeLimit: isFree
				? reason === 'daily'
					? FULL_ENTITLEMENTS.dailyGenerations
					: FULL_ENTITLEMENTS.maxApplications
				: undefined,
		})
	}

	return { explain, reached }
}
