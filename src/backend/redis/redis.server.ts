import { Redis } from 'ioredis'
import type { AppConfig } from '../config.server'
import type { Logger } from '../observability/logger.server'

export type { Redis }

declare global {
	var __altShiftRedis: Redis | undefined
}

export function createRedisClient({
	config,
	rootLogger,
}: {
	config: AppConfig
	rootLogger: Logger
}): Redis {
	globalThis.__altShiftRedis ??= connect(config.redis.url, rootLogger)

	return globalThis.__altShiftRedis
}

function connect(url: string, logger: Logger): Redis {
	const client = new Redis(url, {
		connectTimeout: 2_000,
		// ═════════════════════════════════════════════════════════════════════
		//   Fail fast instead of queueing, so callers can degrade without Redis.
		// ═════════════════════════════════════════════════════════════════════
		enableOfflineQueue: false,
		// ═════════════════════════════════════════════════════════════════════
		//   Railway's private network is IPv6-only.
		// ═════════════════════════════════════════════════════════════════════
		family: 0,
		maxRetriesPerRequest: 1,
	})

	client.on('error', (err) => logger.warn({ err }, 'Redis connection error'))

	return client
}
