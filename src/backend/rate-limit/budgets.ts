import type { SystemActor } from '../auth/actor'
import type { FixedTier, PlanTier } from './rate-limit-tiers'

// ═══════════════════════════════════════════════════════════════════════════
//   One charge against one budget. A plan-driven tier carries its ceiling
//   with the charge — how a plan raises its daily quota — and the type
//   requires it.
// ═══════════════════════════════════════════════════════════════════════════
export type Budget =
	| { key: string; tier: FixedTier }
	| { key: string; limit: number; tier: PlanTier }

// ═══════════════════════════════════════════════════════════════════════════
//   The only place a budget's KEY is spelled. The code that charges a
//   budget and the code that reports its usage (the billing overview) must
//   address the very same counter; built here, they cannot drift apart —
//   a screen that read a differently keyed counter would promise letters
//   the server then refuses.
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
