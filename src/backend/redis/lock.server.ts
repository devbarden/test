import { randomUUID } from 'node:crypto'
import type { Logger } from '../observability/logger.server'
import type { Redis } from './redis.server'

// ═══════════════════════════════════════════════════════════════════════════
//   `release` is idempotent: a holder may reach it from several exits (the
//   stream ending, the request being aborted) without coordinating which
//   one runs first.
// ═══════════════════════════════════════════════════════════════════════════
export type Lock = { release: () => Promise<void> }

// ═══════════════════════════════════════════════════════════════════════════
//   Deletes the key only if it still holds OUR token. A plain DEL could
//   remove a lock that already expired and was taken by someone else — the
//   classic way a Redis lock stops being one.
// ═══════════════════════════════════════════════════════════════════════════
const RELEASE_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
end
return 0`

const NOOP_LOCK: Lock = { release: async () => {} }

// ═══════════════════════════════════════════════════════════════════════════
//   A best-effort mutual exclusion with a TTL, so a process that dies while
//   holding a lock cannot hold it forever. It guards against waste (two
//   tabs generating at once), not against corruption, which is why an
//   unreachable Redis grants the lock instead of blocking the user.
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
