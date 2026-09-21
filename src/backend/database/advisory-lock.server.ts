import type { Prisma } from '@/generated/prisma/client'
import type { PrismaClient } from './prisma.server'

// ═══════════════════════════════════════════════════════════════════════════
//   Transaction-scoped lock: COMMIT or ROLLBACK releases it, so a crash
//   cannot leave it held.
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
