import { Redis } from 'ioredis'
import type { AppConfig } from '../config.server'
import type { Logger } from '../observability/logger.server'

export type { Redis }

const globalCache = globalThis as { __altShiftRedis?: Redis }

// ═══════════════════════════════════════════════════════════════════════════
//   Fails fast (no offline queue) so callers degrade; `family: 0` because
//   Railway's private network is IPv6-only.
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
