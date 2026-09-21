// ═══════════════════════════════════════════════════════════════════════════
//   Access is checked by feature, never by plan name, so plans can be
//   repackaged without touching the code that enforces them.
// ═══════════════════════════════════════════════════════════════════════════
export const BILLING_FEATURES = [
	'extended_daily_quota',
	'extended_history',
	'letter_tones',
] as const

export type BillingFeature = (typeof BILLING_FEATURES)[number]

export function isBillingFeature(slug: string): slug is BillingFeature {
	return (BILLING_FEATURES as readonly string[]).includes(slug)
}

export const PLAN_IDS = ['free', 'pro'] as const

export type PlanId = (typeof PLAN_IDS)[number]

export const PLAN_SLUGS: Record<PlanId, string> = {
	free: 'free_user',
	pro: 'pro',
}

export type Entitlements = {
	dailyGenerations: number
	letterTones: boolean
	maxApplications: number
}

const BASE_LIMITS = { dailyGenerations: 10, maxApplications: 20 }
const EXTENDED_LIMITS = { dailyGenerations: 100, maxApplications: 500 }

export function entitlementsFor(
	features: Iterable<BillingFeature>,
): Entitlements {
	const granted = new Set(features)

	return {
		dailyGenerations: granted.has('extended_daily_quota')
			? EXTENDED_LIMITS.dailyGenerations
			: BASE_LIMITS.dailyGenerations,
		letterTones: granted.has('letter_tones'),
		maxApplications: granted.has('extended_history')
			? EXTENDED_LIMITS.maxApplications
			: BASE_LIMITS.maxApplications,
	}
}

export const FREE_ENTITLEMENTS = entitlementsFor([])

export const FULL_ENTITLEMENTS = entitlementsFor(BILLING_FEATURES)

type HasCheck = (
	check: { feature: BillingFeature } | { plan: string },
) => boolean

export type Subscription = {
	entitlements: Entitlements
	plan: PlanId
}

export function subscriptionFrom(has: HasCheck): Subscription {
	return {
		entitlements: entitlementsFor(
			BILLING_FEATURES.filter((feature) => has({ feature })),
		),
		plan: has({ plan: PLAN_SLUGS.pro }) ? 'pro' : 'free',
	}
}
