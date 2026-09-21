import type { Lock, LockService } from '@/backend/cache/lock.server'
import type { AppConfig } from '@/backend/config.server'
import type { UserActor } from '@/backend/di/actor'
import { ConflictError, toAppError } from '@/backend/errors.server'
import type { GenerationApiGateway } from '@/backend/gateways/generation-api/generation-api.gateway.server'
import type { Logger } from '@/backend/observability/logger.server'
import type {
	RateLimiter,
	RateLimitTier,
} from '@/backend/web/rate-limit.server'
import type { ApplicationService } from '@/features/applications/application.service.server'
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

export function createGenerationService({
	applicationService,
	config,
	generationApiGateway,
	lockService,
	logger,
	rateLimiter,
	userActor,
}: GenerationServiceDeps) {
	const { userId } = userActor

	// ═════════════════════════════════════════════════════════════════════════
	//   Admission, cheapest refusal first: the lock (is another letter for
	//   this user already being written?), then the user's minute and day
	//   budgets, then the deployment-wide upstream budget. Points already
	//   taken are refunded if a later check refuses, so a user is never
	//   charged for a letter that was never attempted.
	// ═════════════════════════════════════════════════════════════════════════
	async function admit(): Promise<Lock> {
		const lock = await lockService.acquire(
			`lock:generation:${userId}`,
			config.generation.lockTtlMs,
		)

		if (!lock) throw new ConflictError('generation_in_progress')

		const steps: [RateLimitTier, string][] = [
			['generationMinute', userId],
			['generationDay', userId],
			['upstream', UPSTREAM_BUDGET_KEY],
		]
		const consumed: [RateLimitTier, string][] = []

		try {
			for (const [tier, key] of steps) {
				await rateLimiter.consume(tier, key)
				consumed.push([tier, key])
			}

			return lock
		} catch (error) {
			await Promise.all(
				consumed.map(([tier, key]) => rateLimiter.refund(tier, key)),
			)
			await lock.release()
			throw error
		}
	}

	async function* run(
		command: GenerateCommand,
		deltas: AsyncIterable<string>,
		signal: AbortSignal,
	): AsyncGenerator<GenerationEvent> {
		const startedAt = performance.now()
		let letter = ''

		try {
			for await (const text of deltas) {
				letter += text
				yield { text, type: 'delta' }
			}
		} catch (error) {
			if (signal.aborted) return

			const appError = toAppError(error)

			logger.warn({ err: appError }, 'Generation failed mid-stream')
			yield { error: appError.toPayload(), type: 'error' }
			return
		}

		if (!letter.trim()) {
			logger.warn('Generation API finished without any text')
			yield { error: { code: 'interrupted' }, type: 'error' }
			return
		}

		try {
			const application = await applicationService.saveLetter({
				applicationId: command.applicationId,
				input: command.input,
				letter: letter.trim(),
			})

			logger.info(
				{
					applicationId: application.id,
					characters: letter.length,
					durationMs: Math.round(performance.now() - startedAt),
				},
				'Letter generated',
			)

			yield { application, type: 'done' }
		} catch (error) {
			const appError = toAppError(error)

			logger.error({ err: appError }, 'Generated letter could not be saved')
			yield {
				error: SAVE_ERRORS_SHOWN_AS_IS.has(appError.code)
					? appError.toPayload()
					: { code: 'save_failed' },
				type: 'error',
			}
		}
	}

	return {
		// ═════════════════════════════════════════════════════════════════════
		//   Resolves once the letter has STARTED — everything refused before
		//   that throws, so the route can answer with a status code. The lock
		//   is released when the stream ends, and also when the request is
		//   aborted: a generator that is never iterated never reaches its
		//   `finally`, and the lock would otherwise sit until its TTL.
		// ═════════════════════════════════════════════════════════════════════
		async start(
			command: GenerateCommand,
			signal: AbortSignal,
		): Promise<AsyncGenerator<GenerationEvent>> {
			if (command.applicationId) {
				await applicationService.get(command.applicationId)
			} else {
				await applicationService.assertCanCreate()
			}

			const lock = await admit()

			signal.addEventListener('abort', () => void lock.release(), {
				once: true,
			})

			try {
				const deltas = await generationApiGateway.openStream({
					...buildCoverLetterPrompt(command.input),
					signal,
				})

				return (async function* () {
					try {
						yield* run(command, deltas, signal)
					} finally {
						await lock.release()
					}
				})()
			} catch (error) {
				await lock.release()
				throw error
			}
		},
	}
}

export type GenerationService = ReturnType<typeof createGenerationService>
