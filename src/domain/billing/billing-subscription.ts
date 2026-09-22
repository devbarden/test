import { BILLING_FEATURES, type BillingFeature, type Entitlements, entitlementsFor } from './billing-entitlements'
import { PLAN_SLUGS, type PlanId } from './billing-plans'

type HasCheck = (check: { feature: BillingFeature } | { plan: string }) => boolean

export type Subscription = {
	entitlements: Entitlements
	plan: PlanId
}

export function subscriptionFrom(has: HasCheck): Subscription {
	return {
		entitlements: entitlementsFor(BILLING_FEATURES.filter((feature) => has({ feature }))),
		plan: has({ plan: PLAN_SLUGS.pro }) ? 'pro' : 'free',
	}
}
