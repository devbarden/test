import type { ApplicationInput } from '@/domain/applications/application.schema'
import type { Application, Prisma } from '@/generated/prisma/client'
import { withAdvisoryLock } from '@/server/database/advisory-lock.server'
import type { DbClient, PrismaClient } from '@/server/database/prisma.server'

type LetterData = { input: ApplicationInput; letter: string }

type ListOptions = {
	cursor?: string
	take: number
	terms?: readonly string[]
}

export function createApplicationRepository({ db }: { db: PrismaClient }) {
	const owned = (userId: string) => ({ userId })
	const active = (userId: string) => ({ ...owned(userId), deletedAt: null })

	async function findActive(userId: string, id: string, client: DbClient = db): Promise<Application | null> {
		return client.application.findFirst({ where: { ...active(userId), id } })
	}

	async function updateOne(
		where: Prisma.ApplicationWhereInput,
		data: Prisma.ApplicationUpdateManyMutationInput,
		client: DbClient = db,
	): Promise<boolean> {
		const { count } = await client.application.updateMany({ data, where })

		return count === 1
	}

	return {
		countActive(userId: string, client: DbClient = db): Promise<number> {
			return client.application.count({ where: active(userId) })
		},

		create(userId: string, { input, letter }: LetterData, client: DbClient = db): Promise<Application> {
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
		//   Keyset pagination on the id: UUIDv7 ids are time-ordered, so one
		//   column is the sort key, the cursor and the index. `id < cursor` has
		//   no ties and stays correct while rows are added or deleted around
		//   it, which an offset would not.
		// ═════════════════════════════════════════════════════════════════════
		listActive(userId: string, { cursor, take, terms = [] }: ListOptions): Promise<Application[]> {
			return db.application.findMany({
				orderBy: { id: 'desc' },
				take,
				where: {
					...active(userId),
					...(cursor ? { id: { lt: cursor } } : {}),
					AND: terms.map(matchingTerm),
				},
			})
		},

		async restore(userId: string, id: string, client: DbClient = db): Promise<Application | null> {
			const restored = await updateOne({ ...owned(userId), deletedAt: { not: null }, id }, { deletedAt: null }, client)

			return restored ? findActive(userId, id, client) : null
		},

		softDelete(userId: string, id: string): Promise<boolean> {
			return updateOne({ ...active(userId), id }, { deletedAt: new Date() })
		},

		async updateLetter(userId: string, id: string, { input, letter }: LetterData): Promise<Application | null> {
			const updated = await updateOne({ ...active(userId), id }, { ...input, letter })

			return updated ? findActive(userId, id) : null
		},

		withUserLock<T>(userId: string, callback: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
			return withAdvisoryLock(db, `applications:${userId}`, callback)
		},
	}
}

function matchingTerm(term: string): Prisma.ApplicationWhereInput {
	const contains = containsLiterally(term)

	return {
		OR: [{ jobTitle: contains }, { company: contains }, { letter: contains }],
	}
}

// ═══════════════════════════════════════════════════════════════════════════
//   Prisma's `contains` does not escape `%` and `_`: `%` alone matched
//   every letter. The backslash goes first, or it would re-escape the
//   escapes just added.
// ═══════════════════════════════════════════════════════════════════════════
function containsLiterally(term: string) {
	return {
		contains: term.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_'),
		mode: 'insensitive' as const,
	}
}

export type ApplicationRepository = ReturnType<typeof createApplicationRepository>
