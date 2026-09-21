import { describe, expect, it, vi } from 'vitest'
import type { Application } from '../model/application'
import { createApplicationStore } from './application-store'
import { createMemoryStorage } from './browser-storage'

const KEY = 'test:applications'

function application(overrides: Partial<Application> = {}): Application {
	return {
		createdAt: 1,
		id: 'a',
		input: {
			company: 'Apple',
			details: '',
			jobTitle: 'Product manager',
			skills: 'HTML',
		},
		letter: 'Dear Apple Team,',
		updatedAt: 1,
		...overrides,
	}
}

function setup(initial?: unknown) {
	const storage = createMemoryStorage()

	if (initial !== undefined) {
		storage.setItem(
			KEY,
			typeof initial === 'string' ? initial : JSON.stringify(initial),
		)
	}

	return { storage, store: createApplicationStore({ key: KEY, storage }) }
}

describe('createApplicationStore', () => {
	it('starts empty when nothing is stored', () => {
		expect(setup().store.getSnapshot()).toEqual([])
	})

	it('persists saved applications newest first', () => {
		const { storage, store } = setup()

		store.save(application({ createdAt: 1, id: 'old' }))
		store.save(application({ createdAt: 2, id: 'new' }))

		const reloaded = createApplicationStore({ key: KEY, storage })

		expect(reloaded.getSnapshot().map(({ id }) => id)).toEqual(['new', 'old'])
	})

	it('replaces an application saved again under the same id', () => {
		const { store } = setup()

		store.save(application({ letter: 'First draft' }))
		store.save(application({ letter: 'Second draft' }))

		expect(store.getSnapshot()).toHaveLength(1)
		expect(store.get('a')?.letter).toBe('Second draft')
	})

	it('removes an application', () => {
		const { store } = setup()

		store.save(application())
		store.remove('a')

		expect(store.getSnapshot()).toEqual([])
	})

	it('returns the same snapshot until something is written', () => {
		const { store } = setup()

		store.save(application())
		const first = store.getSnapshot()

		expect(store.getSnapshot()).toBe(first)

		store.save(application({ id: 'b' }))

		expect(store.getSnapshot()).not.toBe(first)
	})

	it('notifies subscribers on write and stops after unsubscribe', () => {
		const { store } = setup()
		const listener = vi.fn()
		const unsubscribe = store.subscribe(listener)

		store.save(application())
		unsubscribe()
		store.remove('a')

		expect(listener).toHaveBeenCalledTimes(1)
	})

	it('keeps the valid entries when one stored entry is corrupted', () => {
		const { store } = setup({
			applications: [application({ id: 'valid' }), { id: 'broken' }],
			version: 1,
		})

		expect(store.getSnapshot().map(({ id }) => id)).toEqual(['valid'])
	})

	it('ignores malformed JSON and an unknown document version', () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {})

		expect(setup('{not json').store.getSnapshot()).toEqual([])
		expect(
			setup({ applications: [application()], version: 99 }).store.getSnapshot(),
		).toEqual([])
	})
})
