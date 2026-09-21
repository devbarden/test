import { withAdvisoryLock } from '@/backend/database/advisory-lock.server'
import type { DbClient, PrismaClient } from '@/backend/database/prisma.server'
import type { Application, Prisma } from '@/generated/prisma/client'
import type { ApplicationInput } from './model/application.schema'

type LetterData = { input: ApplicationInput; letter: string }

type Page = { cursor?: string; take: number; terms?: readonly string[] }

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

		listActive(
			userId: string,
			{ cursor, take, terms = [] }: Page,
		): Promise<Application[]> {
			return db.application.findMany({
				orderBy: { id: 'desc' },
				take,
				where: {
					...active(userId),
					...(cursor ? { id: { lt: cursor } } : {}),
					AND: terms.map(literalPattern).map((pattern) => ({
						OR: [
							{ jobTitle: { contains: pattern, mode: 'insensitive' as const } },
							{ company: { contains: pattern, mode: 'insensitive' as const } },
						],
					})),
				},
			})
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

		withUserLock<T>(
			userId: string,
			callback: (tx: Prisma.TransactionClient) => Promise<T>,
		): Promise<T> {
			return withAdvisoryLock(db, `applications:${userId}`, callback)
		},
	}
}

// ═══════════════════════════════════════════════════════════════════════════
//   Prisma's `contains` does not escape `%` and `_`: `%` alone matched
//   every letter.
// ═══════════════════════════════════════════════════════════════════════════
function literalPattern(term: string): string {
	return term.replace(/[\\%_]/g, (character) => `\\${character}`)
}

export type ApplicationRepository = ReturnType<
	typeof createApplicationRepository
>
