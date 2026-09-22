import type { Prisma } from '@/generated/prisma/client'
import type { PrismaClient } from './prisma.server'

// ═══════════════════════════════════════════════════════════════════════════
//   Released by COMMIT or ROLLBACK, so a crash cannot leave it held.
// ═══════════════════════════════════════════════════════════════════════════
async function lockUntilCommit(tx: Prisma.TransactionClient, key: string): Promise<void> {
	await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`
}

export function withAdvisoryLock<T>(
	db: PrismaClient,
	key: string,
	callback: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
	return db.$transaction(async (tx) => {
		await lockUntilCommit(tx, key)

		return callback(tx)
	})
}
