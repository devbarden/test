import {
	RateLimiterMemory,
	RateLimiterRedis,
	RateLimiterRes,
} from 'rate-limiter-flexible'
import type { AppConfig } from '../config.server'
import { RateLimitError } from '../errors.server'
import type { Logger } from '../observability/logger.server'
import type { Redis } from '../redis/redis.server'
import {
	type RateLimitTier,
	rateLimitPolicies,
	type TierPolicy,
} from './rate-limit-tiers'

export type { RateLimitTier } from './rate-limit-tiers'

// ═══════════════════════════════════════════════════════════════════════════
//   One charge against one budget. `limit` overrides the tier's default
//   ceiling for this caller — how a plan raises its daily quota.
// ═══════════════════════════════════════════════════════════════════════════
export type Budget = {
	key: string
	limit?: number
	tier: RateLimitTier
}

type LimitOptions = { limit?: number }

export type RateLimitUsage = {
	consumed: number
	limit: number
	resetInSeconds: number
}

// ═══════════════════════════════════════════════════════════════════════════
//   Counters live in Redis so the limits hold across replicas. If Redis is
//   unreachable each limiter falls back to an in-memory one of the same
//   size: limits then apply per process — looser, but never OFF. Failing
//   open would hand the shared upstream budget to whoever notices first.
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
	const policies = rateLimitPolicies(config)
	const limiters = new Map<string, RateLimiterRedis>()

	// ═════════════════════════════════════════════════════════════════════════
	//   One limiter per (tier, limit), all writing the SAME Redis counter for
	//   a tier: the stored value is points consumed, and the limit is only
	//   compared against it. A user who upgrades mid-day therefore keeps what
	//   they already spent and gets the higher ceiling at once.
	// ═════════════════════════════════════════════════════════════════════════
	function limiterFor(tier: RateLimitTier, limit?: number): RateLimiterRedis {
		const { durationSeconds, points: defaultPoints } = policies[tier]
		const points = limit ?? defaultPoints
		const id = `${tier}:${points}`
		const cached = limiters.get(id)

		if (cached) return cached

		const keyPrefix = `rl:${tier}`
		const limiter = new RateLimiterRedis({
			duration: durationSeconds,
			insuranceLimiter: new RateLimiterMemory({
				duration: durationSeconds,
				keyPrefix,
				points,
			}),
			keyPrefix,
			points,
			rejectIfRedisNotReady: true,
			storeClient: redis,
		})

		limiters.set(id, limiter)

		return limiter
	}

	function refusal(
		tier: RateLimitTier,
		policy: TierPolicy,
		rejection: RateLimiterRes,
	): RateLimitError {
		return new RateLimitError(
			policy.exceededCode,
			Math.max(1, Math.ceil(rejection.msBeforeNext / 1000)),
			`Rate limit "${tier}" exceeded`,
		)
	}

	async function consume(
		tier: RateLimitTier,
		key: string,
		{ limit }: LimitOptions = {},
	): Promise<void> {
		try {
			await limiterFor(tier, limit).consume(key)
		} catch (rejection) {
			if (rejection instanceof RateLimiterRes) {
				throw refusal(tier, policies[tier], rejection)
			}

			rootLogger.error(
				{ err: rejection, tier },
				'Rate limiter failed; allowing the request',
			)
		}
	}

	// ═════════════════════════════════════════════════════════════════════════
	//   Gives a point back when a request was counted but never got to do
	//   the work. Best effort: a refund that fails only costs the user one
	//   point until the window rolls over.
	// ═════════════════════════════════════════════════════════════════════════
	async function refund(
		tier: RateLimitTier,
		key: string,
		{ limit }: LimitOptions = {},
	): Promise<void> {
		await limiterFor(tier, limit)
			.reward(key, 1)
			.catch((error: unknown) => {
				rootLogger.warn({ err: error, tier }, 'Rate limit refund failed')
			})
	}

	return {
		consume,

		// ═════════════════════════════════════════════════════════════════════
		//   Charges several budgets as one: in order, and if any of them
		//   refuses, the ones already charged are refunded before the refusal
		//   is rethrown. A caller is never billed for work that a later budget
		//   stopped from happening. Order the cheapest, most personal budgets
		//   first and shared ones last, so a user who is over their own limit
		//   never spends the shared one.
		// ═════════════════════════════════════════════════════════════════════
		async consumeAll(budgets: readonly Budget[]): Promise<void> {
			const charged: Budget[] = []

			try {
				for (const budget of budgets) {
					await consume(budget.tier, budget.key, budget)
					charged.push(budget)
				}
			} catch (error) {
				await Promise.all(
					charged.map((budget) => refund(budget.tier, budget.key, budget)),
				)
				throw error
			}
		},

		async peek(
			tier: RateLimitTier,
			key: string,
			{ limit }: LimitOptions = {},
		): Promise<RateLimitUsage> {
			const limiter = limiterFor(tier, limit)
			const state = await limiter.get(key).catch(() => null)

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
