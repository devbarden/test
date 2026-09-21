import { describe, expect, it } from 'vitest'
import { ConflictError } from '@/backend/errors.server'
import { silentLogger, testUser } from '@/test/fixtures'
import { setupTestDatabase } from '@/test/integration/clients'
import { createApplicationRepository } from './application.repository.server'
import { createApplicationService } from './application.service.server'

const db = setupTestDatabase()
const repository = createApplicationRepository({ db })

const letter = {
	input: {
		company: 'Apple',
		details: '',
		jobTitle: 'PM',
		skills: 'HTML',
		tone: 'professional' as const,
	},
	letter: 'Dear Apple Team,',
}

describe('applicationRepository (Postgres)', () => {
	it('keeps every read and write inside the owner', async () => {
		const mine = await repository.create('alice', letter)

		expect(await repository.findActive('mallory', mine.id)).toBeNull()
		expect(await repository.softDelete('mallory', mine.id)).toBe(false)
		expect(
			await repository.updateLetter('mallory', mine.id, {
				...letter,
				letter: 'x',
			}),
		).toBeNull()
		expect((await repository.findActive('alice', mine.id))?.letter).toBe(
			letter.letter,
		)
	})

	it('lists newest first by UUIDv7 id and pages with a cursor', async () => {
		const created = []

		for (let index = 0; index < 5; index += 1) {
			created.push(
				await repository.create('alice', { ...letter, letter: `#${index}` }),
			)
		}

		const firstPage = await repository.listActive('alice', { take: 3 })
		const secondPage = await repository.listActive('alice', {
			cursor: firstPage.at(-1)?.id,
			take: 3,
		})

		expect(firstPage.map((row) => row.letter)).toEqual(['#4', '#3', '#2'])
		expect(secondPage.map((row) => row.letter)).toEqual(['#1', '#0'])
	})

	it('soft-deletes, restores, and purges only past the cutoff', async () => {
		const row = await repository.create('alice', letter)

		expect(await repository.softDelete('alice', row.id)).toBe(true)
		expect(await repository.countActive('alice')).toBe(0)
		expect((await repository.restore('alice', row.id))?.id).toBe(row.id)
		expect(await repository.softDelete('alice', row.id)).toBe(true)

		expect(
			await repository.purgeDeletedBefore(new Date(Date.now() - 60_000)),
		).toBe(0)
		expect(
			await repository.purgeDeletedBefore(new Date(Date.now() + 60_000)),
		).toBe(1)
	})

	it('holds the per-user cap under concurrent inserts', async () => {
		const service = createApplicationService({
			applicationRepository: repository,
			logger: silentLogger,
			userActor: testUser('alice', { maxApplications: 1 }),
		})

		const results = await Promise.allSettled(
			Array.from({ length: 5 }, () => service.saveLetter(letter)),
		)
		const rejected = results.filter((result) => result.status === 'rejected')

		expect(
			results.filter((result) => result.status === 'fulfilled'),
		).toHaveLength(1)
		expect(
			rejected.every((result) => result.reason instanceof ConflictError),
		).toBe(true)
		expect(await repository.countActive('alice')).toBe(1)
	})
})
