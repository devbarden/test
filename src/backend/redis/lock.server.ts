import { randomUUID } from 'node:crypto'
import type { Logger } from '../observability/logger.server'
import type { Redis } from './redis.server'

export type Lock = { release: () => Promise<void> }

// ═══════════════════════════════════════════════════════════════════════════
//   Deletes the key only if it still holds our token, so a lock that expired
//   and was taken by another request is never freed by us.
// ═══════════════════════════════════════════════════════════════════════════
const DELETE_IF_OWNER = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
end
return 0`

const NO_LOCK: Lock = { release: async () => {} }

export function createLockService({
	redis,
	rootLogger,
}: {
	redis: Redis
	rootLogger: Logger
}) {
	async function acquire(key: string, ttlMs: number): Promise<Lock | null> {
		const token = randomUUID()

		try {
			const result = await redis.set(key, token, 'PX', ttlMs, 'NX')

			if (result !== 'OK') return null
		} catch (err) {
			// ═════════════════════════════════════════════════════════════════
			//   The lock saves money, not data: without Redis, proceed unlocked.
			// ═════════════════════════════════════════════════════════════════
			rootLogger.warn({ err, key }, 'Redis unavailable; proceeding unlocked')
			return NO_LOCK
		}

		return { release: () => release(key, token) }
	}

	async function release(key: string, token: string): Promise<void> {
		try {
			await redis.eval(DELETE_IF_OWNER, 1, key, token)
		} catch (err) {
			rootLogger.warn({ err, key }, 'Lock release failed; it will expire')
		}
	}

	return { acquire }
}

export type LockService = ReturnType<typeof createLockService>
