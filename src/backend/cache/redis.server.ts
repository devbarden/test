import { Redis } from 'ioredis'
import type { AppConfig } from '../config.server'
import type { Logger } from '../observability/logger.server'

export type { Redis }

const globalCache = globalThis as { __altShiftRedis?: Redis }

// ═══════════════════════════════════════════════════════════════════════════
//   Redis holds only coordination state — rate-limit counters and the
//   one-generation-per-user lock — never data, so the client is tuned to
//   fail FAST rather than wait:
//
//   - `enableOfflineQueue: false` and one retry per command: while Redis is
//     unreachable a command errors at once, and the callers degrade (the
//     limiter falls back to per-process memory, the lock is skipped)
//     instead of holding requests open.
//   - `family: 0` resolves both IPv4 and IPv6. Railway's private network is
//     IPv6-only; ioredis defaults to IPv4 and would never connect there.
// ═══════════════════════════════════════════════════════════════════════════
export function createRedisClient({
	config,
	rootLogger,
}: {
	config: AppConfig
	rootLogger: Logger
}): Redis {
	if (globalCache.__altShiftRedis) return globalCache.__altShiftRedis

	const client = new Redis(config.redis.url, {
		connectTimeout: 2_000,
		enableOfflineQueue: false,
		family: 0,
		maxRetriesPerRequest: 1,
		retryStrategy: (attempt) => Math.min(attempt * 250, 5_000),
	})

	let lastErrorLoggedAt = 0

	client.on('error', (error) => {
		if (Date.now() - lastErrorLoggedAt < 30_000) return

		lastErrorLoggedAt = Date.now()
		rootLogger.warn({ err: error }, 'Redis connection error')
	})

	if (!config.isProduction) globalCache.__altShiftRedis = client

	return client
}
