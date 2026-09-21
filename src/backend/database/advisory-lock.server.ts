import type { Prisma } from '@/generated/prisma/client'
import type { PrismaClient } from './prisma.server'

// ═══════════════════════════════════════════════════════════════════════════
//   Runs `callback` in a transaction that first takes a transaction-scoped
//   advisory lock on `key`: every caller holding the same key is serialised,
//   and the lock is released by COMMIT or ROLLBACK — never by our code, so a
//   crash cannot leave it held. This is how a "check, then write" rule (a
//   per-user cap) stays true under concurrent requests without locking any
//   row or table.
//
//   Keys are namespaced by the caller (`applications:<userId>`) so two
//   unrelated rules never wait on each other; `hashtextextended` maps the
//   text to the 64-bit id Postgres locks on.
// ═══════════════════════════════════════════════════════════════════════════
export function withAdvisoryLock<T>(
	db: PrismaClient,
	key: string,
	callback: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
	return db.$transaction(async (tx) => {
		await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`

		return callback(tx)
	})
}
