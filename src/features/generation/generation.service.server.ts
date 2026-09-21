import type { AppConfig } from '@/backend/config.server'
import type { UserActor } from '@/backend/di/actor'
import {
	ConflictError,
	PlanRequiredError,
	toAppError,
} from '@/backend/errors.server'
import type { GenerationApiGateway } from '@/backend/gateways/generation-api/generation-api.gateway.server'
import type { Logger } from '@/backend/observability/logger.server'
import type {
	Budget,
	RateLimiter,
} from '@/backend/rate-limit/rate-limiter.server'
import type { Lock, LockService } from '@/backend/redis/lock.server'
import type { ApplicationService } from '@/features/applications/application.service.server'
import { DEFAULT_LETTER_TONE } from '@/features/applications/application-tone'
import type { ApiError } from '@/lib/api-error'
import { buildCoverLetterPrompt } from './cover-letter-prompt'
import type { GenerateCommand, GenerationEvent } from './protocol'

type GenerationServiceDeps = {
	applicationService: ApplicationService
	config: AppConfig
	generationApiGateway: GenerationApiGateway
	lockService: LockService
	logger: Logger
	rateLimiter: RateLimiter
	userActor: UserActor
}

const UPSTREAM_BUDGET_KEY = 'generation-api'

// ═══════════════════════════════════════════════════════════════════════════
//   Save failures the user can act on keep their own code; anything else
//   (the database being down) is reported as `save_failed`, which tells the
//   UI to keep the letter on screen for copying.
// ═══════════════════════════════════════════════════════════════════════════
const SAVE_ERRORS_SHOWN_AS_IS = new Set<ApiError['code']>([
	'not_found',
	'application_limit_reached',
])

type RelayOutcome =
	| { letter: string; ok: true }
	| { error: ApiError | null; ok: false }

// ═══════════════════════════════════════════════════════════════════════════
//   A letter goes through four phases, each refusing as early and as
//   cheaply as it can:
//
//   1. allowed?   the plan covers the tone; the application is the user's
//                 own (Try Again) or the cap leaves room (a new one)
//   2. reserve    one generation per user at a time (Redis lock), then the
//                 minute budget, the plan's daily quota and the shared
//                 upstream budget — charged together, refunded together
//   3. relay      fragments pass from the provider to the browser as they
//                 arrive, and are collected
//   4. finish     the letter is saved, and only then announced as `done`
//
//   Phases 1–2 and opening the upstream stream happen before the first
//   byte, so their refusals become HTTP statuses; phases 3–4 can only
//   report through an `error` event.
// ═══════════════════════════════════════════════════════════════════════════
export function createGenerationService({
	applicationService,
	config,
	generationApiGateway,
	lockService,
	logger,
	rateLimiter,
	userActor,
}: GenerationServiceDeps) {
	const { entitlements, userId } = userActor

	async function assertAllowed({
		applicationId,
		input,
	}: GenerateCommand): Promise<void> {
		if (input.tone !== DEFAULT_LETTER_TONE && !entitlements.letterTones) {
			throw new PlanRequiredError('Letter tones are not in the user plan')
		}

		if (applicationId) await applicationService.get(applicationId)
		else await applicationService.assertCanCreate()
	}

	async function reserve(): Promise<Lock> {
		const lock = await lockService.acquire(
			`lock:generation:${userId}`,
			config.generation.lockTtlMs,
		)

		if (!lock) throw new ConflictError('generation_in_progress')

		const budgets: Budget[] = [
			{ key: userId, tier: 'generationMinute' },
			{
				key: userId,
				limit: entitlements.dailyGenerations,
				tier: 'generationDay',
			},
			{ key: UPSTREAM_BUDGET_KEY, tier: 'upstream' },
		]

		try {
			await rateLimiter.consumeAll(budgets)

			return lock
		} catch (error) {
			await lock.release()
			throw error
		}
	}

	async function* relay(
		deltas: AsyncIterable<string>,
		signal: AbortSignal,
	): AsyncGenerator<GenerationEvent, RelayOutcome> {
		let letter = ''

		try {
			for await (const text of deltas) {
				letter += text
				yield { text, type: 'delta' }
			}
		} catch (error) {
			if (signal.aborted) return { error: null, ok: false }

			const appError = toAppError(error)

			logger.warn({ err: appError }, 'Generation failed mid-stream')

			return { error: appError.toPayload(), ok: false }
		}

		if (!letter.trim()) {
			logger.warn('Generation API finished without any text')

			return { error: { code: 'interrupted' }, ok: false }
		}

		return { letter: letter.trim(), ok: true }
	}

	async function finish(
		command: GenerateCommand,
		letter: string,
		startedAt: number,
	): Promise<GenerationEvent> {
		try {
			const application = await applicationService.saveLetter({
				applicationId: command.applicationId,
				input: command.input,
				letter,
			})

			logger.info(
				{
					applicationId: application.id,
					characters: letter.length,
					durationMs: Math.round(performance.now() - startedAt),
				},
				'Letter generated',
			)

			return { application, type: 'done' }
		} catch (error) {
			const appError = toAppError(error)

			logger.error({ err: appError }, 'Generated letter could not be saved')

			return {
				error: SAVE_ERRORS_SHOWN_AS_IS.has(appError.code)
					? appError.toPayload()
					: { code: 'save_failed' },
				type: 'error',
			}
		}
	}

	async function* stream(
		command: GenerateCommand,
		deltas: AsyncIterable<string>,
		signal: AbortSignal,
		lock: Lock,
	): AsyncGenerator<GenerationEvent> {
		const startedAt = performance.now()

		try {
			const outcome = yield* relay(deltas, signal)

			if (outcome.ok) yield await finish(command, outcome.letter, startedAt)
			else if (outcome.error) yield { error: outcome.error, type: 'error' }
		} finally {
			await lock.release()
		}
	}

	return {
		// ═════════════════════════════════════════════════════════════════════
		//   Resolves once the letter has STARTED; everything refused before
		//   that throws. The lock is released when the stream ends, and also
		//   when the request is aborted: a generator that is never iterated
		//   never reaches its `finally`, and the lock would otherwise sit
		//   until its TTL.
		// ═════════════════════════════════════════════════════════════════════
		async start(
			command: GenerateCommand,
			signal: AbortSignal,
		): Promise<AsyncGenerator<GenerationEvent>> {
			await assertAllowed(command)

			const lock = await reserve()

			signal.addEventListener('abort', () => void lock.release(), {
				once: true,
			})

			try {
				const deltas = await generationApiGateway.openStream({
					...buildCoverLetterPrompt(command.input),
					signal,
				})

				return stream(command, deltas, signal, lock)
			} catch (error) {
				await lock.release()
				throw error
			}
		},
	}
}

export type GenerationService = ReturnType<typeof createGenerationService>
