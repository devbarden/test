import {
	RateLimiterMemory,
	RateLimiterRedis,
	RateLimiterRes,
} from 'rate-limiter-flexible'
import type { AppConfig } from '../config.server'
import { RateLimitError } from '../errors/app-error.server'
import type { Logger } from '../observability/logger.server'
import type { Redis } from '../redis/redis.server'
import type { Budget } from './budgets'
import {
	fixedTierPolicies,
	PLAN_TIER_POLICIES,
	type RateLimitTier,
	type TierPolicy,
} from './rate-limit-tiers'

export type RateLimitUsage = {
	consumed: number
	limit: number
	resetInSeconds: number
}

// ═══════════════════════════════════════════════════════════════════════════
//   If Redis is down, limits fall back to per-process memory: looser, never
//   off.
// ═══════════════════════════════════════════════════════════════════════════
export function createRateLimiter({
	config,
	redis,
	rootLogger,
}: {
	config: AppConfig
	redis: Redis
	rootLogger: Logger
}) {
	const fixedPolicies = fixedTierPolicies(config)
	const limiters = new Map<string, RateLimiterRedis>()

	function policyOf(tier: RateLimitTier): TierPolicy {
		return tier === 'generationDay'
			? PLAN_TIER_POLICIES[tier]
			: fixedPolicies[tier]
	}

	function pointsOf(budget: Budget): number {
		return 'limit' in budget ? budget.limit : fixedPolicies[budget.tier].points
	}

	// ═════════════════════════════════════════════════════════════════════════
	//   All limits of a tier share one counter, so an upgrade keeps what was
	//   spent.
	// ═════════════════════════════════════════════════════════════════════════
	function limiterFor(budget: Budget): RateLimiterRedis {
		const points = pointsOf(budget)
		const id = `${budget.tier}:${points}`
		const cached = limiters.get(id)

		if (cached) return cached

		const duration = policyOf(budget.tier).durationSeconds
		const keyPrefix = `rl:${budget.tier}`
		const limiter = new RateLimiterRedis({
			duration,
			insuranceLimiter: new RateLimiterMemory({ duration, keyPrefix, points }),
			keyPrefix,
			points,
			rejectIfRedisNotReady: true,
			storeClient: redis,
		})

		limiters.set(id, limiter)

		return limiter
	}

	// ═════════════════════════════════════════════════════════════════════════
	//   A refused attempt gives its point back, so refusals never eat a later
	//   plan's quota.
	// ═════════════════════════════════════════════════════════════════════════
	async function consume(budget: Budget): Promise<void> {
		const limiter = limiterFor(budget)

		try {
			await limiter.consume(budget.key)
		} catch (rejection) {
			if (rejection instanceof RateLimiterRes) {
				await limiter.reward(budget.key, 1).catch(() => {})

				throw new RateLimitError(
					policyOf(budget.tier).exceededCode,
					Math.max(1, Math.ceil(rejection.msBeforeNext / 1000)),
					`Rate limit "${budget.tier}" exceeded`,
				)
			}

			rootLogger.error(
				{ err: rejection, tier: budget.tier },
				'Rate limiter failed; allowing the request',
			)
		}
	}

	async function refund(budget: Budget): Promise<void> {
		await limiterFor(budget)
			.reward(budget.key, 1)
			.catch((error: unknown) => {
				rootLogger.warn(
					{ err: error, tier: budget.tier },
					'Rate limit refund failed',
				)
			})
	}

	return {
		consume,

		async consumeAll(budgets: readonly Budget[]): Promise<void> {
			const charged: Budget[] = []

			try {
				for (const budget of budgets) {
					await consume(budget)
					charged.push(budget)
				}
			} catch (error) {
				await Promise.all(charged.map(refund))
				throw error
			}
		},

		async peek(budget: Budget): Promise<RateLimitUsage> {
			const limiter = limiterFor(budget)
			const state = await limiter.get(budget.key).catch(() => null)

			return {
				consumed: Math.min(state?.consumedPoints ?? 0, limiter.points),
				limit: limiter.points,
				resetInSeconds: Math.ceil((state?.msBeforeNext ?? 0) / 1000),
			}
		},

		refund,
	}
}

export type RateLimiter = ReturnType<typeof createRateLimiter>
