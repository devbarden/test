import type { Entitlements } from './billing-entitlements'
import type { PlanId } from './billing-plans'

export type BillingOverview = {
	entitlements: Entitlements
	plan: PlanId
	usage: {
		applications: number
		generationsResetInSeconds: number
		generationsInWindow: number
	}
}
