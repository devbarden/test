import type { AppConfig } from '../config.server'

const MINUTE = 60
const DAY = 24 * 60 * MINUTE

// ═══════════════════════════════════════════════════════════════════════════
//   Every budget in the system and what it protects — the policy, kept
//   apart from the mechanism that enforces it (rate-limiter.server.ts) and
//   from the keys it is charged under (budgets.ts):
//
//   ip                  any dynamic request, per client IP — floods and
//                       scrapers, before auth costs anything
//   user                every authenticated call, per user
//   system              the Clerk webhook and the scheduler, per source
//                       and IP — they authenticate by signature or secret
//   generationMinute    letters per user per minute — "Try Again" mashing
//   upstream            the Generation API's own budget (6/min per TOKEN),
//                       one bucket for the whole deployment: every user of
//                       this service shares it, so it is spent here, where
//                       it can be refused politely, not at the provider
//   generationDay       letters per user per day — the PLAN's quota. Its
//                       size is not policy but the caller's entitlement,
//                       so it has no default here: a charge against it must
//                       carry its limit (see budgets.ts), and forgetting it
//                       is a type error rather than a silent free-tier
//                       ceiling.
// ═══════════════════════════════════════════════════════════════════════════
export const FIXED_TIERS = [
	'ip',
	'user',
	'system',
	'generationMinute',
	'upstream',
] as const

export type FixedTier = (typeof FIXED_TIERS)[number]

export type PlanTier = 'generationDay'

export type RateLimitTier = FixedTier | PlanTier

type ExceededCode = 'rate_limited' | 'quota_exceeded'

export type TierPolicy = {
	durationSeconds: number
	exceededCode: ExceededCode
}

export type FixedTierPolicy = TierPolicy & { points: number }

export function fixedTierPolicies({
	rateLimits,
}: AppConfig): Record<FixedTier, FixedTierPolicy> {
	const perMinute = (points: number): FixedTierPolicy => ({
		durationSeconds: MINUTE,
		exceededCode: 'rate_limited',
		points,
	})

	return {
		generationMinute: perMinute(rateLimits.generationsPerMinute),
		ip: perMinute(rateLimits.requestsPerMinutePerIp),
		system: perMinute(rateLimits.systemRequestsPerMinute),
		upstream: perMinute(rateLimits.upstreamRequestsPerMinute),
		user: perMinute(rateLimits.requestsPerMinutePerUser),
	}
}

export const PLAN_TIER_POLICIES: Record<PlanTier, TierPolicy> = {
	generationDay: { durationSeconds: DAY, exceededCode: 'quota_exceeded' },
}
