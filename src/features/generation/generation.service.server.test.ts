import { describe, expect, it } from 'vitest'
import {
	ConflictError,
	NotFoundError,
	RateLimitError,
	UpstreamError,
} from '@/backend/errors.server'
import type { ApplicationRepository } from '@/features/applications/application.repository.server'
import { createApplicationService } from '@/features/applications/application.service.server'
import { createFakeApplicationRepository } from '@/test/fakes/application-repository.fake'
import {
	createFakeGateway,
	createFakeLockService,
	createFakeRateLimiter,
} from '@/test/fakes/generation.fakes'
import { fragments, silentLogger, testConfig, testUser } from '@/test/fixtures'
import { createGenerationService } from './generation.service.server'
import type { GenerationEvent } from './protocol'

const input = {
	company: 'Apple',
	details: '',
	jobTitle: 'Product manager',
	skills: 'HTML',
}

type SetupOptions = {
	held?: boolean
	refused?: Parameters<typeof createFakeRateLimiter>[0]
	repository?: ApplicationRepository
	stream?: () => AsyncGenerator<string>
	userId?: string
}

function setup({
	held,
	refused,
	repository = createFakeApplicationRepository().repository,
	stream = () => fragments('Dear ', 'Apple Team,'),
	userId = 'alice',
}: SetupOptions = {}) {
	const config = testConfig()
	const lock = createFakeLockService({ held })
	const limits = createFakeRateLimiter(refused)
	const applicationService = createApplicationService({
		applicationRepository: repository,
		config,
		logger: silentLogger,
		userActor: testUser(userId),
	})
	const service = createGenerationService({
		applicationService,
		config,
		generationApiGateway: createFakeGateway(stream),
		lockService: lock.lockService,
		logger: silentLogger,
		rateLimiter: limits.limiter,
		userActor: testUser(userId),
	})

	return { applicationService, limits, lock, service }
}

async function drain(events: AsyncIterable<GenerationEvent>) {
	const collected: GenerationEvent[] = []

	for await (const event of events) collected.push(event)

	return collected
}

const signal = () => new AbortController().signal

describe('generationService', () => {
	it('streams the letter, saves it, and announces the saved application', async () => {
		const { applicationService, limits, lock, service } = setup()
		const events = await drain(await service.start({ input }, signal()))

		expect(events.slice(0, 2)).toEqual([
			{ text: 'Dear ', type: 'delta' },
			{ text: 'Apple Team,', type: 'delta' },
		])

		const done = events.at(-1)

		expect(done?.type).toBe('done')
		expect(done?.type === 'done' && done.application.letter).toBe(
			'Dear Apple Team,',
		)
		expect(await applicationService.stats()).toEqual({ goal: 5, total: 1 })
		expect(limits.consumed).toEqual([
			'generationMinute',
			'generationDay',
			'upstream',
		])
		expect(lock.state).toEqual({ acquired: 1, released: 1 })
	})

	it('refuses a second generation while one is running, charging nothing', async () => {
		const { limits, service } = setup({ held: true })

		await expect(service.start({ input }, signal())).rejects.toBeInstanceOf(
			ConflictError,
		)
		expect(limits.consumed).toEqual([])
	})

	it('refunds budgets already taken when a later one refuses', async () => {
		const { limits, lock, service } = setup({ refused: ['upstream'] })

		await expect(service.start({ input }, signal())).rejects.toBeInstanceOf(
			RateLimitError,
		)
		expect(limits.refunded).toEqual(['generationMinute', 'generationDay'])
		expect(lock.state).toEqual({ acquired: 1, released: 1 })
	})

	it('reports the daily quota as quota_exceeded', async () => {
		const { service } = setup({ refused: ['generationDay'] })
		const error = await service
			.start({ input }, signal())
			.catch((cause) => cause)

		expect(error).toBeInstanceOf(RateLimitError)
		expect(error.code).toBe('quota_exceeded')
	})

	it('ends with an error event and saves nothing when the stream breaks', async () => {
		async function* broken() {
			yield 'Dear '
			throw new UpstreamError('interrupted', 'socket closed')
		}

		const { applicationService, lock, service } = setup({ stream: broken })
		const events = await drain(await service.start({ input }, signal()))

		expect(events.at(-1)).toEqual({
			error: { code: 'interrupted' },
			type: 'error',
		})
		expect(await applicationService.stats()).toEqual({ goal: 5, total: 0 })
		expect(lock.state.released).toBe(1)
	})

	it('reports save_failed when the finished letter cannot be stored', async () => {
		const { repository } = createFakeApplicationRepository()
		const { service } = setup({
			repository: {
				...repository,
				withUserLock: async () => {
					throw new Error('connection refused')
				},
			},
		})
		const events = await drain(await service.start({ input }, signal()))

		expect(events.at(-1)).toEqual({
			error: { code: 'save_failed' },
			type: 'error',
		})
	})

	it("refuses to regenerate someone else's letter before spending anything", async () => {
		const { repository } = createFakeApplicationRepository()
		const owner = setup({ repository, userId: 'alice' })
		const [done] = (
			await drain(await owner.service.start({ input }, signal()))
		).slice(-1)
		const applicationId = done?.type === 'done' ? done.application.id : ''
		const intruder = setup({ repository, userId: 'mallory' })

		await expect(
			intruder.service.start({ applicationId, input }, signal()),
		).rejects.toBeInstanceOf(NotFoundError)
		expect(intruder.limits.consumed).toEqual([])
	})

	it('releases the lock when the request is aborted before streaming starts', async () => {
		const controller = new AbortController()
		const { lock, service } = setup()

		await service.start({ input }, controller.signal)
		controller.abort()

		expect(lock.state.released).toBeGreaterThanOrEqual(1)
	})
})
