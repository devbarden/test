import { randomUUID } from 'node:crypto'
import type { Logger } from '../observability/logger.server'
import type { Redis } from './redis.server'

export type Lock = { release: () => Promise<void> }

// ═══════════════════════════════════════════════════════════════════════════
//   Deletes only while it holds our token; a plain DEL could free someone
//   else's lock.
// ═══════════════════════════════════════════════════════════════════════════
const RELEASE_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
end
return 0`

const NOOP_LOCK: Lock = { release: async () => {} }

// ═══════════════════════════════════════════════════════════════════════════
//   Guards against waste, not corruption, so an unreachable Redis grants the
//   lock.
// ═══════════════════════════════════════════════════════════════════════════
export function createLockService({
	redis,
	rootLogger,
}: {
	redis: Redis
	rootLogger: Logger
}) {
	return {
		async acquire(key: string, ttlMs: number): Promise<Lock | null> {
			const token = randomUUID()

			try {
				const acquired = await redis.set(key, token, 'PX', ttlMs, 'NX')

				if (acquired !== 'OK') return null
			} catch (error) {
				rootLogger.warn(
					{ err: error, key },
					'Lock store unavailable; proceeding unlocked',
				)
				return NOOP_LOCK
			}

			let released = false

			return {
				release: async () => {
					if (released) return

					released = true
					await redis
						.eval(RELEASE_SCRIPT, 1, key, token)
						.catch((error: unknown) => {
							rootLogger.warn(
								{ err: error, key },
								'Lock release failed; it will expire',
							)
						})
				},
			}
		},
	}
}

export type LockService = ReturnType<typeof createLockService>
