import type { Entitlements, PlanId } from './billing.catalog'

export type BillingOverview = {
	entitlements: Entitlements
	plan: PlanId
	usage: {
		applications: number
		generationsResetInSeconds: number
		generationsToday: number
	}
}
