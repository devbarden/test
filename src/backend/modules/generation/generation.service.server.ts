import type { UserActor } from '@/backend/auth/actor'
import type { AppConfig } from '@/backend/config.server'
import {
	ConflictError,
	PlanRequiredError,
	toAppError,
} from '@/backend/errors/app-error.server'
import type { GenerationApiGateway } from '@/backend/gateways/generation-api.gateway.server'
import type { ApplicationService } from '@/backend/modules/applications/application.service.server'
import type { Logger } from '@/backend/observability/logger.server'
import { budgets } from '@/backend/rate-limit/budgets'
import type { RateLimiter } from '@/backend/rate-limit/rate-limiter.server'
import type { Lock, LockService } from '@/backend/redis/lock.server'
import { DEFAULT_LETTER_TONE } from '@/domain/applications/application-tone'
import type {
	GenerateCommand,
	GenerationEvent,
} from '@/domain/generation/protocol'
import type { ApiError } from '@/lib/api/api-error'
import { toPlainText } from '@/lib/text/plain-text'
import { buildCoverLetterPrompt } from './cover-letter-prompt.server'

const SAVE_ERRORS_SHOWN_AS_IS = new Set<ApiError['code']>([
	'not_found',
	'application_limit_reached',
])

type RelayOutcome =
	| { letter: string; ok: true }
	| { error: ApiError | null; ok: false }

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
}: {
	applicationService: ApplicationService
	config: AppConfig
	generationApiGateway: GenerationApiGateway
	lockService: LockService
	logger: Logger
	rateLimiter: RateLimiter
	userActor: UserActor
}) {
	const { entitlements, userId } = userActor
	const dailyQuota = budgets.dailyGenerations(
		userId,
		entitlements.dailyGenerations,
	)

	const refundDailyQuota = () => rateLimiter.refund(dailyQuota)

	async function assertAllowed({
		applicationId,
		input,
	}: GenerateCommand): Promise<void> {
		if (input.tone !== DEFAULT_LETTER_TONE && !entitlements.letterTones) {
			throw new PlanRequiredError('Letter tones are not in the user plan')
		}

		await applicationService.assertCanSave(applicationId)
	}

	async function reserve(): Promise<Lock> {
		const lock = await lockService.acquire(
			`lock:generation:${userId}`,
			config.generation.lockTtlMs,
		)

		if (!lock) throw new ConflictError('generation_in_progress')

		try {
			await rateLimiter.consumeAll([
				budgets.generationsPerMinute(userId),
				dailyQuota,
				budgets.generationApi(),
			])

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
		const { maxLetterCharacters } = config.generation
		let letter = ''

		try {
			for await (const fragment of deltas) {
				const text = toPlainText(fragment)

				letter += text

				if (letter.length > maxLetterCharacters) {
					logger.warn(
						{ characters: letter.length },
						'Generation API exceeded the letter length bound',
					)

					return { error: { code: 'interrupted' }, ok: false }
				}

				if (text) yield { text, type: 'delta' }
			}
		} catch (error) {
			if (signal.aborted) return { error: null, ok: false }

			const appError = toAppError(error)

			logger.warn({ err: appError }, 'Generation failed mid-stream')

			return { error: appError.toPayload(), ok: false }
		}

		const trimmed = letter.trim()

		if (!trimmed) {
			logger.warn('Generation API finished without any text')

			return { error: { code: 'interrupted' }, ok: false }
		}

		return { letter: trimmed, ok: true }
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
			await refundDailyQuota()

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

			if (outcome.ok) {
				// ═══════════════════════════════════════════════════════════════
				//   The save starts before `saving` is yielded: a browser that leaves
				//   never pulls again, and the paid-for letter would be lost.
				// ═══════════════════════════════════════════════════════════════
				const saved = finish(command, outcome.letter, startedAt)

				yield { type: 'saving' }
				yield await saved
			} else if (outcome.error) {
				await refundDailyQuota()
				yield { error: outcome.error, type: 'error' }
			}
		} finally {
			await lock.release()
		}
	}

	return {
		// ═════════════════════════════════════════════════════════════════════
		//   Also released on abort: a generator suspended at an unread `yield`
		//   never reaches its `finally`.
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
				await Promise.all([lock.release(), refundDailyQuota()])
				throw error
			}
		},
	}
}
