import {
	RateLimiterMemory,
	RateLimiterRedis,
	RateLimiterRes,
} from 'rate-limiter-flexible'
import type { Redis } from '../cache/redis.server'
import type { AppConfig } from '../config.server'
import { RateLimitError } from '../errors.server'
import type { Logger } from '../observability/logger.server'

const MINUTE = 60
const DAY = 24 * 60 * MINUTE

// ═══════════════════════════════════════════════════════════════════════════
//   Every tier and what it protects:
//
//   ip                  any dynamic request, per client IP — floods and
//                       scrapers, before auth costs anything
//   user                every authenticated call, per user
//   generationMinute    letters per user per minute — "Try Again" mashing
//   generationDay       letters per user per day — a quota, reported as
//                       `quota_exceeded` so the UI can say "come back
//                       tomorrow" rather than "wait a few seconds"
//   upstream            the Generation API's own budget (6/min per TOKEN),
//                       one bucket for the whole deployment: every user of
//                       this service shares it, so it is spent here, where
//                       it can be refused politely, not at the provider
//   webhook             signature-checked webhooks, per IP
//
//   Counters live in Redis so the limits hold across replicas. If Redis is
//   unreachable each tier falls back to an in-memory limiter of the same
//   size: limits then apply per process — looser, but never OFF. Failing
//   open would hand the upstream budget to whoever notices first.
// ═══════════════════════════════════════════════════════════════════════════
export type RateLimitTier =
	| 'ip'
	| 'user'
	| 'generationMinute'
	| 'generationDay'
	| 'upstream'
	| 'webhook'

type TierDefinition = { duration: number; points: number }

export function createRateLimiter({
	config,
	redis,
	rootLogger,
}: {
	config: AppConfig
	redis: Redis
	rootLogger: Logger
}) {
	const { limits } = config

	const definitions: Record<RateLimitTier, TierDefinition> = {
		generationDay: { duration: DAY, points: limits.generationsPerDay },
		generationMinute: { duration: MINUTE, points: limits.generationsPerMinute },
		ip: { duration: MINUTE, points: limits.requestsPerMinutePerIp },
		upstream: { duration: MINUTE, points: limits.upstreamRequestsPerMinute },
		user: { duration: MINUTE, points: limits.requestsPerMinutePerUser },
		webhook: { duration: MINUTE, points: limits.webhooksPerMinutePerIp },
	}

	const limiters = Object.fromEntries(
		Object.entries(definitions).map(([tier, { duration, points }]) => [
			tier,
			new RateLimiterRedis({
				duration,
				insuranceLimiter: new RateLimiterMemory({ duration, points }),
				keyPrefix: `rl:${tier}`,
				points,
				rejectIfRedisNotReady: true,
				storeClient: redis,
			}),
		]),
	) as Record<RateLimitTier, RateLimiterRedis>

	return {
		async consume(tier: RateLimitTier, key: string): Promise<void> {
			try {
				await limiters[tier].consume(key)
			} catch (rejection) {
				if (!(rejection instanceof RateLimiterRes)) {
					rootLogger.error(
						{ err: rejection, tier },
						'Rate limiter failed; allowing the request',
					)
					return
				}

				throw new RateLimitError(
					tier === 'generationDay' ? 'quota_exceeded' : 'rate_limited',
					Math.max(1, Math.ceil(rejection.msBeforeNext / 1000)),
					`Rate limit "${tier}" exceeded`,
				)
			}
		},

		// ═════════════════════════════════════════════════════════════════════
		//   Gives a point back when a request was counted but never got to do
		//   the work — e.g. a user's generation budget, when the shared
		//   upstream budget then refused the same request.
		// ═════════════════════════════════════════════════════════════════════
		async refund(tier: RateLimitTier, key: string): Promise<void> {
			await limiters[tier].reward(key, 1).catch((error: unknown) => {
				rootLogger.warn({ err: error, tier }, 'Rate limit refund failed')
			})
		},
	}
}

export type RateLimiter = ReturnType<typeof createRateLimiter>
