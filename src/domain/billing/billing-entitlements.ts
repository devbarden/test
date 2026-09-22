// ═══════════════════════════════════════════════════════════════════════════
//   Access is checked by feature, never by plan name, so plans can be
//   repackaged without touching the code that enforces them.
// ═══════════════════════════════════════════════════════════════════════════
export const BILLING_FEATURES = ['extended_daily_quota', 'extended_history', 'letter_tones'] as const

export type BillingFeature = (typeof BILLING_FEATURES)[number]

export function isBillingFeature(slug: string): slug is BillingFeature {
	return BILLING_FEATURES.some((feature) => feature === slug)
}

export type Entitlements = {
	dailyGenerations: number
	letterTones: boolean
	maxApplications: number
}

// ═══════════════════════════════════════════════════════════════════════════
//   Free keeps exactly the five letters the product pushes the user towards:
//   the goal and the ceiling are the same number, so the sixth is Pro.
// ═══════════════════════════════════════════════════════════════════════════
const BASE_LIMITS = { dailyGenerations: 10, maxApplications: 5 }
const EXTENDED_LIMITS = { dailyGenerations: 100, maxApplications: 500 }

export function entitlementsFor(features: Iterable<BillingFeature>): Entitlements {
	const granted = new Set(features)

	return {
		dailyGenerations: granted.has('extended_daily_quota')
			? EXTENDED_LIMITS.dailyGenerations
			: BASE_LIMITS.dailyGenerations,
		letterTones: granted.has('letter_tones'),
		maxApplications: granted.has('extended_history') ? EXTENDED_LIMITS.maxApplications : BASE_LIMITS.maxApplications,
	}
}

export const FREE_ENTITLEMENTS = entitlementsFor([])

export const FULL_ENTITLEMENTS = entitlementsFor(BILLING_FEATURES)
