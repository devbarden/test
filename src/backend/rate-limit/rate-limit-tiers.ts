import type { AppConfig } from '../config.server'

const MINUTE = 60
const DAY = 24 * 60 * MINUTE

// ═══════════════════════════════════════════════════════════════════════════
//   `upstream` is one bucket for the whole deployment: the provider allows
//   6/min per token.
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
