import { describe, expect, it } from 'vitest'
import { ConflictError, NotFoundError } from '@/backend/errors.server'
import { createFakeApplicationRepository } from '@/test/fakes/application-repository.fake'
import { silentLogger, testConfig, testUser } from '@/test/fixtures'
import { APPLICATIONS_PAGE_SIZE } from './application.schema'
import { createApplicationService } from './application.service.server'

const input = {
	company: 'Apple',
	details: '',
	jobTitle: 'Product manager',
	skills: 'HTML',
}

function setup({ cap }: { cap?: number } = {}) {
	const config = testConfig()

	if (cap !== undefined) config.limits.applicationsPerUser = cap

	const { repository, rows } = createFakeApplicationRepository()
	const service = (userId = 'alice') =>
		createApplicationService({
			applicationRepository: repository,
			config,
			logger: silentLogger,
			userActor: testUser(userId),
		})

	return { rows, service }
}

describe('applicationService', () => {
	it('creates a letter and regenerates it in place', async () => {
		const { service } = setup()
		const created = await service().saveLetter({ input, letter: 'First' })
		const updated = await service().saveLetter({
			applicationId: created.id,
			input: { ...input, company: 'Stripe' },
			letter: 'Second',
		})

		expect(updated.id).toBe(created.id)
		expect(updated.letter).toBe('Second')
		expect(updated.input.company).toBe('Stripe')
		expect(await service().stats()).toEqual({ goal: 5, total: 1 })
	})

	it("never exposes or modifies another user's letter", async () => {
		const { service } = setup()
		const { id } = await service('alice').saveLetter({ input, letter: 'Mine' })

		await expect(service('mallory').get(id)).rejects.toBeInstanceOf(
			NotFoundError,
		)
		await expect(service('mallory').remove(id)).rejects.toBeInstanceOf(
			NotFoundError,
		)
		await expect(
			service('mallory').saveLetter({
				applicationId: id,
				input,
				letter: 'Hijacked',
			}),
		).rejects.toBeInstanceOf(NotFoundError)
		expect((await service('alice').get(id)).letter).toBe('Mine')
	})

	it('pages newest first with a cursor', async () => {
		const { service } = setup()

		for (let index = 0; index < APPLICATIONS_PAGE_SIZE + 2; index += 1) {
			await service().saveLetter({ input, letter: `Letter ${index}` })
		}

		const first = await service().list({})
		const second = await service().list({
			cursor: first.nextCursor ?? undefined,
		})

		expect(first.items).toHaveLength(APPLICATIONS_PAGE_SIZE)
		expect(first.items[0]?.letter).toBe(`Letter ${APPLICATIONS_PAGE_SIZE + 1}`)
		expect(second.items.map(({ letter }) => letter)).toEqual([
			'Letter 1',
			'Letter 0',
		])
		expect(second.nextCursor).toBeNull()
	})

	it('soft-deletes and restores the exact letter', async () => {
		const { service } = setup()
		const { id } = await service().saveLetter({ input, letter: 'Keep me' })

		await service().remove(id)
		expect(await service().stats()).toEqual({ goal: 5, total: 0 })

		const restored = await service().restore(id)

		expect(restored.letter).toBe('Keep me')
		await expect(service().restore(id)).rejects.toBeInstanceOf(NotFoundError)
	})

	it('enforces the per-user cap on create and restore', async () => {
		const { service } = setup({ cap: 1 })
		const { id } = await service().saveLetter({ input, letter: 'One' })

		await service().remove(id)
		await service().saveLetter({ input, letter: 'Two' })

		await expect(service().assertCanCreate()).rejects.toBeInstanceOf(
			ConflictError,
		)
		await expect(
			service().saveLetter({ input, letter: 'Three' }),
		).rejects.toBeInstanceOf(ConflictError)
		await expect(service().restore(id)).rejects.toBeInstanceOf(ConflictError)
	})
})
