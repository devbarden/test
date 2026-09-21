import type { SystemActor } from '../auth/actor'
import type { FixedTier, PlanTier } from './rate-limit-tiers'

export type Budget =
	| { key: string; tier: FixedTier }
	| { key: string; limit: number; tier: PlanTier }

// ═══════════════════════════════════════════════════════════════════════════
//   The only place a key is spelled, so charging and reporting use one
//   counter.
// ═══════════════════════════════════════════════════════════════════════════
export const budgets = {
	clientIp: (clientIp: string): Budget => ({ key: clientIp, tier: 'ip' }),

	dailyGenerations: (userId: string, limit: number): Budget => ({
		key: userId,
		limit,
		tier: 'generationDay',
	}),

	generationApi: (): Budget => ({ key: 'generation-api', tier: 'upstream' }),

	generationsPerMinute: (userId: string): Budget => ({
		key: userId,
		tier: 'generationMinute',
	}),

	system: (source: SystemActor['source'], clientIp: string): Budget => ({
		key: `${source}:${clientIp}`,
		tier: 'system',
	}),

	user: (userId: string): Budget => ({ key: userId, tier: 'user' }),
}
