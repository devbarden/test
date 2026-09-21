// ═══════════════════════════════════════════════════════════════════════════
//   The product catalogue, in code. Clerk Billing holds the same plans and
//   features (clerk/billing.json is what gets pushed there) and is the
//   source of truth for WHO has what; this file is the source of truth for
//   what a feature MEANS — the limits and options it unlocks.
//
//   Access is decided by FEATURE, never by plan name: a limit reads
//   "does this user have extended_history", not "is this user on Pro". Plans
//   can then be repackaged — a cheaper tier with only one feature, a
//   promotion that grants one — without touching the code that enforces it.
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

// ═══════════════════════════════════════════════════════════════════════════
//   The one reading of Clerk's `has()`, shared by the server that enforces
//   a plan and the browser that only shows it, so the two can never
//   disagree about what a session grants.
// ═══════════════════════════════════════════════════════════════════════════
export function subscriptionFrom(has: HasCheck): Subscription {
	return {
		entitlements: entitlementsFor(
			BILLING_FEATURES.filter((feature) => has({ feature })),
		),
		plan: has({ plan: PLAN_SLUGS.pro }) ? 'pro' : 'free',
	}
}
