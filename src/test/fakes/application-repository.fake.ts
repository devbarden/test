import type { ApplicationRepository } from '@/features/applications/application.repository.server'
import type { Application } from '@/generated/prisma/client'

// ═══════════════════════════════════════════════════════════════════════════
//   An in-memory stand-in with the repository's exact contract, so service
//   tests exercise business rules without a database. The integration tests
//   hold the real repository to the same behaviour.
// ═══════════════════════════════════════════════════════════════════════════
export function createFakeApplicationRepository(seed: Application[] = []) {
	const rows = new Map(seed.map((row) => [row.id, { ...row }]))
	let sequence = 0

	const nextId = () => {
		sequence += 1
		return `01900000-0000-7000-8000-${String(sequence).padStart(12, '0')}`
	}

	const active = (userId: string) =>
		[...rows.values()]
			.filter((row) => row.userId === userId && row.deletedAt === null)
			.sort((a, b) => (a.id < b.id ? 1 : -1))

	const repository: ApplicationRepository = {
		countActive: async (userId) => active(userId).length,
		create: async (userId, { input, letter }) => {
			const now = new Date()
			const row: Application = {
				...input,
				createdAt: now,
				deletedAt: null,
				id: nextId(),
				letter,
				updatedAt: now,
				userId,
			}

			rows.set(row.id, row)

			return row
		},
		deleteAllForUser: async (userId) => {
			const owned = [...rows.values()].filter((row) => row.userId === userId)

			for (const row of owned) rows.delete(row.id)

			return { count: owned.length }
		},
		findActive: async (userId, id) =>
			active(userId).find((row) => row.id === id) ?? null,
		listActive: async (userId, { cursor, take }) =>
			active(userId)
				.filter((row) => !cursor || row.id < cursor)
				.slice(0, take),
		purgeDeletedBefore: async (cutoff) => {
			const expired = [...rows.values()].filter(
				(row) => row.deletedAt && row.deletedAt < cutoff,
			)

			for (const row of expired) rows.delete(row.id)

			return { count: expired.length }
		},
		restore: async (userId, id) => {
			const row = rows.get(id)

			if (!row || row.userId !== userId || !row.deletedAt) return null

			row.deletedAt = null

			return row
		},
		softDelete: async (userId, id) => {
			const row = rows.get(id)

			if (!row || row.userId !== userId || row.deletedAt) return false

			row.deletedAt = new Date()

			return true
		},
		updateLetter: async (userId, id, { input, letter }) => {
			const row = rows.get(id)

			if (!row || row.userId !== userId || row.deletedAt) return null

			Object.assign(row, input, { letter, updatedAt: new Date() })

			return row
		},
		withUserLock: async (_userId, callback) => callback(undefined as never),
	}

	return { repository, rows }
}
