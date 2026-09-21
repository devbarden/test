import type { AppConfig } from '../config.server'

const MINUTE = 60
const DAY = 24 * 60 * MINUTE

// ═══════════════════════════════════════════════════════════════════════════
//   Every budget in the system and what it protects — the policy, kept
//   apart from the mechanism that enforces it (rate-limiter.server.ts):
//
//   ip                  any dynamic request, per client IP — floods and
//                       scrapers, before auth costs anything
//   user                every authenticated call, per user
//   generationMinute    letters per user per minute — "Try Again" mashing
//   generationDay       letters per user per day — the plan's quota,
//                       reported as `quota_exceeded` so the UI can say
//                       "come back tomorrow" (or "upgrade") rather than
//                       "wait a few seconds"
//   upstream            the Generation API's own budget (6/min per TOKEN),
//                       one bucket for the whole deployment: every user of
//                       this service shares it, so it is spent here, where
//                       it can be refused politely, not at the provider
//   webhook             signature-checked webhooks and the scheduler, per
//                       source and IP
// ═══════════════════════════════════════════════════════════════════════════
export const RATE_LIMIT_TIERS = [
	'ip',
	'user',
	'generationMinute',
	'generationDay',
	'upstream',
	'webhook',
] as const

export type RateLimitTier = (typeof RATE_LIMIT_TIERS)[number]

export type TierPolicy = {
	durationSeconds: number
	exceededCode: 'rate_limited' | 'quota_exceeded'
	points: number
}

export function rateLimitPolicies({
	limits,
}: AppConfig): Record<RateLimitTier, TierPolicy> {
	const perMinute = (points: number): TierPolicy => ({
		durationSeconds: MINUTE,
		exceededCode: 'rate_limited',
		points,
	})

	return {
		generationDay: {
			durationSeconds: DAY,
			exceededCode: 'quota_exceeded',
			points: limits.defaultGenerationsPerDay,
		},
		generationMinute: perMinute(limits.generationsPerMinute),
		ip: perMinute(limits.requestsPerMinutePerIp),
		upstream: perMinute(limits.upstreamRequestsPerMinute),
		user: perMinute(limits.requestsPerMinutePerUser),
		webhook: perMinute(limits.webhooksPerMinutePerIp),
	}
}
