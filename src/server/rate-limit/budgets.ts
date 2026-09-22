import type { SystemActor, UserActor } from '../auth/actor'

export type Budget = {
	durationSeconds: number
	exceededCode: 'rate_limited' | 'quota_exceeded'
	key: string
	name: string
	points: number
}

const MINUTE = 60
const DAY = 24 * 60 * MINUTE

function perMinute(name: string, points: number, key: string): Budget {
	return {
		durationSeconds: MINUTE,
		exceededCode: 'rate_limited',
		key,
		name,
		points,
	}
}

// ═══════════════════════════════════════════════════════════════════════════
//   The only place a key is spelled, so charging and reporting use one
//   counter.
// ═══════════════════════════════════════════════════════════════════════════
export const budgets = {
	clientIp: (clientIp: string) => perMinute('ip', 600, clientIp),

	dailyGenerations: ({ entitlements, userId }: UserActor): Budget => ({
		durationSeconds: DAY,
		exceededCode: 'quota_exceeded',
		key: userId,
		name: 'generationDay',
		points: entitlements.dailyGenerations,
	}),

	// ═════════════════════════════════════════════════════════════════════════
	//   One bucket for the whole deployment: the provider allows 6/min per
	//   token.
	// ═════════════════════════════════════════════════════════════════════════
	generationApi: () => perMinute('upstream', 6, 'generation-api'),

	generationsPerMinute: (userId: string) => perMinute('generationMinute', 4, userId),

	system: (source: SystemActor['source'], clientIp: string) => perMinute('system', 300, `${source}:${clientIp}`),

	user: (userId: string) => perMinute('user', 300, userId),
}
