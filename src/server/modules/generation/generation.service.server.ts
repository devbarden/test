import { DEFAULT_LETTER_TONE } from '@/domain/applications/application-tone'
import type { GenerateCommand, GenerationEvent } from '@/domain/generation/generation.schema'
import type { ApiError } from '@/lib/api/api-error'
import type { UserActor } from '@/server/auth/actor'
import type { AppConfig } from '@/server/config.server'
import { ConflictError, PlanRequiredError, toAppError } from '@/server/errors/app-error.server'
import type { GenerationApiGateway } from '@/server/gateways'
import type { ApplicationService } from '@/server/modules/applications/application.service.server'
import type { Logger } from '@/server/observability/logger.server'
import { budgets } from '@/server/rate-limit/budgets'
import type { RateLimiter } from '@/server/rate-limit/rate-limiter.server'
import type { Lock, LockService } from '@/server/redis/lock.server'
import { buildCoverLetterPrompt } from './cover-letter-prompt.server'
import { type RelayedLetter, relayLetter } from './letter-relay.server'

// ═══════════════════════════════════════════════════════════════════════════
//   The user's own doing (deleted the letter, or restored one into the last
//   slot mid-stream): shown as is and never refunded, or delete → restore
//   would be unlimited free generations.
// ═══════════════════════════════════════════════════════════════════════════
const USER_CAUSED_SAVE_ERRORS = new Set<ApiError['code']>(['not_found', 'application_limit_reached'])

type Deps = {
	applicationService: ApplicationService
	config: AppConfig
	generationApiGateway: GenerationApiGateway
	lockService: LockService
	logger: Logger
	rateLimiter: RateLimiter
	userActor: UserActor
}

// ═══════════════════════════════════════════════════════════════════════════
//   A run that fails for a reason not the user's refunds the daily quota;
//   a Stop does not — the model was already paid for.
// ═══════════════════════════════════════════════════════════════════════════
export function createGenerationService({
	applicationService,
	config,
	generationApiGateway,
	lockService,
	logger,
	rateLimiter,
	userActor,
}: Deps) {
	const { entitlements, userId } = userActor
	const { lockTtlMs, maxLetterCharacters } = config.generation
	const dailyQuota = budgets.dailyGenerations(userActor)

	const refundDailyQuota = () => rateLimiter.refund(dailyQuota)

	async function assertAllowed({ applicationId, input }: GenerateCommand): Promise<void> {
		if (input.tone !== DEFAULT_LETTER_TONE && !entitlements.letterTones) {
			throw new PlanRequiredError('Letter tones are not in the user plan')
		}

		await applicationService.assertCanSave(applicationId)
	}

	async function reserve(): Promise<Lock> {
		const lock = await lockService.acquire(`lock:generation:${userId}`, lockTtlMs)

		if (!lock) throw new ConflictError('generation_in_progress')

		try {
			await rateLimiter.consumeAll([budgets.generationsPerMinute(userId), dailyQuota, budgets.generationApi()])

			return lock
		} catch (error) {
			await lock.release()
			throw error
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
			const letter = yield* relayLetter(deltas, maxLetterCharacters)

			// ═════════════════════════════════════════════════════════════════
			//   The save starts before `saving` is yielded: a browser that
			//   leaves never pulls again, and the letter would be lost.
			// ═════════════════════════════════════════════════════════════════
			const saved = save(command, letter, startedAt)

			yield { type: 'saving' }
			yield await saved
		} catch (error) {
			if (!signal.aborted) yield await abandon(error)
		} finally {
			await lock.release()
		}
	}

	async function abandon(error: unknown): Promise<GenerationEvent> {
		const appError = toAppError(error)

		logger.warn({ err: appError }, 'Generation failed mid-stream')
		await refundDailyQuota()

		return { error: appError.toPayload(), type: 'error' }
	}

	// ═════════════════════════════════════════════════════════════════════════
	//   Time to first token and total duration are the two numbers that tell
	//   a slow provider from a slow save.
	// ═════════════════════════════════════════════════════════════════════════
	async function save(
		{ applicationId, input }: GenerateCommand,
		{ firstTokenMs, text }: RelayedLetter,
		startedAt: number,
	): Promise<GenerationEvent> {
		try {
			const application = await applicationService.saveLetter({ applicationId, input, letter: text })

			logger.info(
				{
					applicationId: application.id,
					characters: text.length,
					durationMs: Math.round(performance.now() - startedAt),
					firstTokenMs,
				},
				'Letter generated',
			)

			return { application, type: 'done' }
		} catch (error) {
			const appError = toAppError(error)

			if (USER_CAUSED_SAVE_ERRORS.has(appError.code)) {
				logger.warn({ err: appError }, 'Generated letter had nowhere to go')

				return { error: appError.toPayload(), type: 'error' }
			}

			logger.error({ err: appError }, 'Generated letter could not be saved')
			await refundDailyQuota()

			return { error: { code: 'save_failed' }, type: 'error' }
		}
	}

	return {
		// ═════════════════════════════════════════════════════════════════════
		//   Also released on abort: a generator suspended at an unread `yield`
		//   never reaches its `finally`.
		// ═════════════════════════════════════════════════════════════════════
		async start(command: GenerateCommand, signal: AbortSignal): Promise<AsyncGenerator<GenerationEvent>> {
			await assertAllowed(command)

			const lock = await reserve()

			signal.addEventListener('abort', () => lock.release(), { once: true })

			try {
				const deltas = await generationApiGateway.openStream({ ...buildCoverLetterPrompt(command.input), signal })

				return stream(command, deltas, signal, lock)
			} catch (error) {
				await Promise.all([lock.release(), refundDailyQuota()])
				throw error
			}
		},
	}
}

export type GenerationService = ReturnType<typeof createGenerationService>
