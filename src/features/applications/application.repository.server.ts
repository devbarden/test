import type { PrismaClient } from '@/backend/database/prisma.server'
import type { Application, Prisma } from '@/generated/prisma/client'
import type { ApplicationInput } from './application.schema'

export type DbClient = PrismaClient | Prisma.TransactionClient

type LetterData = { input: ApplicationInput; letter: string }

type Page = { cursor?: string; take: number }

// ═══════════════════════════════════════════════════════════════════════════
//   Every method takes the owner's `userId` and puts it in the WHERE clause
//   itself (`owned`). There is no "find by id" that a service could call
//   and then forget to check ownership on: a row that belongs to someone
//   else is indistinguishable from a row that does not exist. That is what
//   makes guessing another user's id useless — no IDOR by construction.
//
//   Every method also takes an optional client, so a service can compose
//   several of them inside one transaction (withUserLock) and have all of
//   them run on that transaction's connection.
// ═══════════════════════════════════════════════════════════════════════════
export function createApplicationRepository({ db }: { db: PrismaClient }) {
	const owned = (userId: string) => ({ userId })
	const active = (userId: string) => ({ ...owned(userId), deletedAt: null })

	async function findActive(
		userId: string,
		id: string,
		client: DbClient = db,
	): Promise<Application | null> {
		return client.application.findFirst({ where: { ...active(userId), id } })
	}

	return {
		countActive(userId: string, client: DbClient = db): Promise<number> {
			return client.application.count({ where: active(userId) })
		},

		create(
			userId: string,
			{ input, letter }: LetterData,
			client: DbClient = db,
		): Promise<Application> {
			return client.application.create({
				data: { ...input, letter, userId },
			})
		},

		async deleteAllForUser(userId: string): Promise<number> {
			const { count } = await db.application.deleteMany({
				where: owned(userId),
			})

			return count
		},

		findActive,

		// ═════════════════════════════════════════════════════════════════════
		//   Keyset pagination on the UUIDv7 primary key: "older than the last
		//   id you saw". Unlike OFFSET it costs the same on page 50 as on page
		//   1, and a letter created or deleted between two page loads cannot
		//   shift a row into both pages or out of both.
		// ═════════════════════════════════════════════════════════════════════
		listActive(userId: string, { cursor, take }: Page): Promise<Application[]> {
			return db.application.findMany({
				orderBy: { id: 'desc' },
				take,
				where: { ...active(userId), ...(cursor ? { id: { lt: cursor } } : {}) },
			})
		},

		async purgeDeletedBefore(cutoff: Date): Promise<number> {
			const { count } = await db.application.deleteMany({
				where: { deletedAt: { lt: cutoff } },
			})

			return count
		},

		async restore(
			userId: string,
			id: string,
			client: DbClient = db,
		): Promise<Application | null> {
			const { count } = await client.application.updateMany({
				data: { deletedAt: null },
				where: { ...owned(userId), deletedAt: { not: null }, id },
			})

			return count === 1 ? findActive(userId, id, client) : null
		},

		async softDelete(userId: string, id: string): Promise<boolean> {
			const { count } = await db.application.updateMany({
				data: { deletedAt: new Date() },
				where: { ...active(userId), id },
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
				where: { ...active(userId), id },
			})

			return count === 1 ? findActive(userId, id) : null
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
