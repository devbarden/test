import { describe, expect, it } from 'vitest'
import { ConflictError, NotFoundError } from '@/backend/errors/app-error.server'
import { createFakeApplicationRepository } from '@/test/fakes/application-repository.fake'
import { silentLogger, testUser } from '@/test/fixtures'
import { createApplicationService } from './application.service.server'
import { APPLICATIONS_PAGE_SIZE } from './model/application.schema'

const input = {
	company: 'Apple',
	details: '',
	jobTitle: 'Product manager',
	skills: 'HTML',
	tone: 'professional' as const,
}

function setup({ cap }: { cap?: number } = {}) {
	const { repository, rows } = createFakeApplicationRepository()
	const service = (userId = 'alice') =>
		createApplicationService({
			applicationRepository: repository,
			logger: silentLogger,
			userActor: testUser(
				userId,
				cap === undefined ? {} : { maxApplications: cap },
			),
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
		expect(await service().stats()).toEqual({ goal: 5, limit: 20, total: 1 })
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
		const { service } = setup({ cap: 100 })

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

	it('lists only the letters that match a search', async () => {
		const { service } = setup()

		await service().saveLetter({ input, letter: 'First' })
		await service().saveLetter({
			input: { ...input, company: 'Google', jobTitle: 'Designer' },
			letter: 'Second',
		})

		const found = await service().list({ search: '  google DESIGN ' })

		expect(found.items.map(({ letter }) => letter)).toEqual(['Second'])
		expect(found.nextCursor).toBeNull()
	})

	it('soft-deletes and restores the exact letter', async () => {
		const { service } = setup()
		const { id } = await service().saveLetter({ input, letter: 'Keep me' })

		await service().remove(id)
		expect(await service().stats()).toEqual({ goal: 5, limit: 20, total: 0 })

		const restored = await service().restore(id)

		expect(restored.letter).toBe('Keep me')
		await expect(service().restore(id)).rejects.toBeInstanceOf(NotFoundError)
	})

	it('enforces the per-user cap on create and restore', async () => {
		const { service } = setup({ cap: 1 })
		const { id } = await service().saveLetter({ input, letter: 'One' })

		await service().remove(id)
		await service().saveLetter({ input, letter: 'Two' })

		await expect(service().assertCanSave()).rejects.toBeInstanceOf(
			ConflictError,
		)
		await expect(
			service().saveLetter({ input, letter: 'Three' }),
		).rejects.toBeInstanceOf(ConflictError)
		await expect(service().restore(id)).rejects.toBeInstanceOf(ConflictError)
	})

	it('allows regenerating an owned letter even at the cap, never a foreign one', async () => {
		const { service } = setup({ cap: 1 })
		const { id } = await service('alice').saveLetter({ input, letter: 'One' })

		await expect(service('alice').assertCanSave(id)).resolves.toBeUndefined()
		await expect(service('mallory').assertCanSave(id)).rejects.toBeInstanceOf(
			NotFoundError,
		)
	})
})
