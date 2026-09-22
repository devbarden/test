import { Redis } from 'ioredis'
import type { AppConfig } from '../config.server'
import type { Logger } from '../observability/logger.server'

export type { Redis }

declare global {
	var __altShiftRedis: Redis | undefined
}

export function createRedisClient({ config, rootLogger }: { config: AppConfig; rootLogger: Logger }): Redis {
	globalThis.__altShiftRedis ??= connect(config.redis, rootLogger)

	return globalThis.__altShiftRedis
}

function connect({ connectTimeoutMs, url }: AppConfig['redis'], logger: Logger): Redis {
	const client = new Redis(url, {
		connectTimeout: connectTimeoutMs,
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

	// ═════════════════════════════════════════════════════════════════════════
	//   ioredis emits an error on every reconnect attempt: log each outage
	//   once, and its end.
	// ═════════════════════════════════════════════════════════════════════════
	let isDown = false

	client.on('error', (err) => {
		if (!isDown) logger.warn({ err }, 'Redis connection lost')
		isDown = true
	})
	client.on('ready', () => {
		if (isDown) logger.info('Redis connection restored')
		isDown = false
	})

	return client
}
