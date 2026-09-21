import type { PrismaClient } from '@/backend/database/prisma.server'
import type { Application, Prisma } from '@/generated/prisma/client'
import type { ApplicationInput } from './application.schema'

type DbClient = PrismaClient | Prisma.TransactionClient

type LetterData = { input: ApplicationInput; letter: string }

const ACTIVE = { deletedAt: null } as const

// ═══════════════════════════════════════════════════════════════════════════
//   Every method takes the owner's `userId` and puts it in the WHERE clause
//   itself. There is no "find by id" that a service could call and then
//   forget to check ownership on: a row that belongs to someone else is
//   indistinguishable from a row that does not exist. That is what makes
//   guessing another user's id useless (no IDOR by construction).
// ═══════════════════════════════════════════════════════════════════════════
export function createApplicationRepository({ db }: { db: PrismaClient }) {
	return {
		countActive(userId: string, client: DbClient = db): Promise<number> {
			return client.application.count({ where: { ...ACTIVE, userId } })
		},

		create(
			userId: string,
			{ input, letter }: LetterData,
			client: DbClient = db,
		): Promise<Application> {
			return client.application.create({ data: { ...input, letter, userId } })
		},

		deleteAllForUser(userId: string): Promise<{ count: number }> {
			return db.application.deleteMany({ where: { userId } })
		},

		findActive(userId: string, id: string): Promise<Application | null> {
			return db.application.findFirst({ where: { ...ACTIVE, id, userId } })
		},

		// ═════════════════════════════════════════════════════════════════════
		//   Keyset pagination on the UUIDv7 primary key: "older than the last
		//   id you saw". Unlike OFFSET it costs the same on page 50 as on page
		//   1, and a letter created or deleted between two page loads cannot
		//   shift a row into both pages or out of both.
		// ═════════════════════════════════════════════════════════════════════
		listActive(
			userId: string,
			{ cursor, take }: { cursor?: string; take: number },
		): Promise<Application[]> {
			return db.application.findMany({
				orderBy: { id: 'desc' },
				take,
				where: {
					...ACTIVE,
					userId,
					...(cursor ? { id: { lt: cursor } } : {}),
				},
			})
		},

		purgeDeletedBefore(cutoff: Date): Promise<{ count: number }> {
			return db.application.deleteMany({
				where: { deletedAt: { lt: cutoff } },
			})
		},

		async restore(userId: string, id: string): Promise<Application | null> {
			const { count } = await db.application.updateMany({
				data: { deletedAt: null },
				where: { deletedAt: { not: null }, id, userId },
			})

			return count === 1 ? this.findActive(userId, id) : null
		},

		async softDelete(userId: string, id: string): Promise<boolean> {
			const { count } = await db.application.updateMany({
				data: { deletedAt: new Date() },
				where: { ...ACTIVE, id, userId },
			})

			return count === 1
		},

		async updateLetter(
			userId: string,
			id: string,
			{ input, letter }: LetterData,
		): Promise<Application | null> {
			const { count } = await db.application.updateMany({
				data: { ...input, letter },
				where: { ...ACTIVE, id, userId },
			})

			return count === 1 ? this.findActive(userId, id) : null
		},

		// ═════════════════════════════════════════════════════════════════════
		//   Serialises writes that must see a consistent count for one user —
		//   "check the per-user cap, then insert" — with a transaction-scoped
		//   advisory lock keyed by the user. Two tabs finishing a letter at the
		//   same instant would otherwise both read 199 and both insert.
		// ═════════════════════════════════════════════════════════════════════
		withUserLock<T>(
			userId: string,
			callback: (tx: Prisma.TransactionClient) => Promise<T>,
		): Promise<T> {
			return db.$transaction(async (tx) => {
				await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 0))`

				return callback(tx)
			})
		},
	}
}

export type ApplicationRepository = ReturnType<
	typeof createApplicationRepository
>
