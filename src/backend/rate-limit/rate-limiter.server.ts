import {
	RateLimiterMemory,
	RateLimiterRedis,
	RateLimiterRes,
} from 'rate-limiter-flexible'
import { RateLimitError } from '../errors/app-error.server'
import type { Logger } from '../observability/logger.server'
import type { Redis } from '../redis/redis.server'
import type { Budget } from './budgets'

type RateLimitUsage = {
	consumed: number
	limit: number
	resetInSeconds: number
}

export function createRateLimiter({
	redis,
	rootLogger,
}: {
	redis: Redis
	rootLogger: Logger
}) {
	const limiters = new Map<string, RateLimiterRedis>()

	// ═════════════════════════════════════════════════════════════════════════
	//   The counter is per name, not per limit, so a plan upgrade keeps what
	//   was spent. Without Redis it falls back to per-process memory.
	// ═════════════════════════════════════════════════════════════════════════
	function limiterFor({ durationSeconds, name, points }: Budget) {
		const id = `${name}:${points}`
		let limiter = limiters.get(id)

		if (!limiter) {
			const options = {
				duration: durationSeconds,
				keyPrefix: `rl:${name}`,
				points,
			}

			limiter = new RateLimiterRedis({
				...options,
				insuranceLimiter: new RateLimiterMemory(options),
				rejectIfRedisNotReady: true,
				storeClient: redis,
			})
			limiters.set(id, limiter)
		}

		return limiter
	}

	async function consume(budget: Budget): Promise<void> {
		const limiter = limiterFor(budget)

		try {
			await limiter.consume(budget.key)
		} catch (rejection) {
			if (!(rejection instanceof RateLimiterRes)) {
				rootLogger.error({ err: rejection }, 'Rate limiter failed; allowing')
				return
			}

			// ═════════════════════════════════════════════════════════════════
			//   A refused attempt gives its point back, so retrying at the limit
			//   never pushes the reset further away.
			// ═════════════════════════════════════════════════════════════════
			await refund(budget)

			throw new RateLimitError(
				budget.exceededCode,
				Math.max(1, Math.ceil(rejection.msBeforeNext / 1000)),
				`Rate limit "${budget.name}" exceeded`,
			)
		}
	}

	async function refund(budget: Budget): Promise<void> {
		try {
			await limiterFor(budget).reward(budget.key, 1)
		} catch (err) {
			rootLogger.warn({ err }, 'Rate limit refund failed')
		}
	}

	async function consumeAll(list: readonly Budget[]): Promise<void> {
		const charged: Budget[] = []

		try {
			for (const budget of list) {
				await consume(budget)
				charged.push(budget)
			}
		} catch (error) {
			await Promise.all(charged.map(refund))
			throw error
		}
	}

	async function peek(budget: Budget): Promise<RateLimitUsage> {
		const state = await limiterFor(budget)
			.get(budget.key)
			.catch(() => null)

		return {
			consumed: Math.min(state?.consumedPoints ?? 0, budget.points),
			limit: budget.points,
			resetInSeconds: Math.ceil((state?.msBeforeNext ?? 0) / 1000),
		}
	}

	return { consume, consumeAll, peek, refund }
}

export type RateLimiter = ReturnType<typeof createRateLimiter>
