import type { UserActor } from '@/backend/auth/actor'
import type { AppConfig } from '@/backend/config.server'
import {
	ConflictError,
	PlanRequiredError,
	toAppError,
} from '@/backend/errors/app-error.server'
import type { GenerationApiGateway } from '@/backend/gateways/generation-api/generation-api.gateway.server'
import type { Logger } from '@/backend/observability/logger.server'
import { budgets } from '@/backend/rate-limit/budgets'
import type { RateLimiter } from '@/backend/rate-limit/rate-limiter.server'
import type { Lock, LockService } from '@/backend/redis/lock.server'
import type { ApplicationService } from '@/features/applications/application.service.server'
import { DEFAULT_LETTER_TONE } from '@/features/applications/model/application-tone'
import type { ApiError } from '@/lib/api/api-error'
import { toPlainText } from '@/lib/plain-text'
import { buildCoverLetterPrompt } from './cover-letter-prompt'
import type { GenerateCommand, GenerationEvent } from './model/protocol'

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
//   4. finish     the save starts, `saving` is announced, and the letter
//                 is announced as `done` only once it is stored
//
//   Phases 1–2 and opening the upstream stream happen before the first
//   byte, so their refusals become HTTP statuses; phases 3–4 can only
//   report through an `error` event.
//
//   The daily quota buys a SAVED letter. When a run ends without one for a
//   reason that is not the user's — the provider down or breaking off, an
//   empty answer, the database refusing the save — its point is given
//   back, so an outage never eats a free user's day. A Stop is not
//   refunded: the model was paid for, and a free Stop would let anyone
//   drain the shared upstream budget at no cost to themselves. The minute
//   and upstream budgets are never refunded once the provider was called:
//   they meter calls, not letters.
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

	// ═════════════════════════════════════════════════════════════════════════
	//   Each fragment is cleaned the way the saved letter is (toPlainText) —
	//   a control character is dropped before the browser shows it, not only
	//   before the database stores it — so what streamed onto the screen and
	//   what `done` carries back are the same text.
	// ═════════════════════════════════════════════════════════════════════════
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
				//   The save starts BEFORE `saving` is sent, not after the
				//   browser reads it. A generator runs only when its consumer
				//   pulls, and a browser that goes away right after `saving`
				//   never pulls again: saving after the yield would drop a
				//   finished, paid-for letter that the UI had already stopped
				//   offering to cancel. `finish` never rejects, so nothing is
				//   left unhandled if nobody awaits it.
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
		//   Resolves once the letter has STARTED; everything refused before
		//   that throws. The lock is released when the stream ends, and also
		//   the moment the request is aborted (Stop): a generator suspended
		//   at a `yield` that nobody reads again never reaches its `finally`,
		//   and the lock would otherwise refuse the user's next Generate
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
				await Promise.all([lock.release(), refundDailyQuota()])
				throw error
			}
		},
	}
}

export type GenerationService = ReturnType<typeof createGenerationService>
