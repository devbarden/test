import type { UserActor } from '@/backend/auth/actor'
import type { DbClient } from '@/backend/database/prisma.server'
import { ConflictError, NotFoundError } from '@/backend/errors/app-error.server'
import type { Logger } from '@/backend/observability/logger.server'
import { toApplicationDto } from './application.mapper'
import type { ApplicationRepository } from './application.repository.server'
import {
	APPLICATION_GOAL,
	APPLICATIONS_PAGE_SIZE,
	type ApplicationDto,
	type ApplicationInput,
	type ApplicationPage,
	type ApplicationStats,
} from './model/application.schema'
import { searchTerms } from './model/application-search'

type SaveLetterCommand = {
	applicationId?: string
	input: ApplicationInput
	letter: string
}

// ═══════════════════════════════════════════════════════════════════════════
//   The signed-in user's letters. The user comes from the request scope
//   (`userActor`), never from an argument, so no caller can ask for someone
//   else's data by passing a different id. How many letters they may keep
//   comes from the same place: it is part of their plan.
// ═══════════════════════════════════════════════════════════════════════════
export function createApplicationService({
	applicationRepository,
	logger,
	userActor,
}: {
	applicationRepository: ApplicationRepository
	logger: Logger
	userActor: UserActor
}) {
	const { entitlements, userId } = userActor

	async function findOwned(id: string) {
		const application = await applicationRepository.findActive(userId, id)

		if (!application) throw new NotFoundError(`Application ${id} not found`)

		return application
	}

	async function assertRoom(client?: DbClient): Promise<void> {
		const total = await applicationRepository.countActive(userId, client)

		if (total >= entitlements.maxApplications) {
			throw new ConflictError('application_limit_reached')
		}
	}

	// ═════════════════════════════════════════════════════════════════════════
	//   Every write that ADDS an active application — a new letter, an undone
	//   delete — goes through here: under the user's advisory lock, the cap is
	//   checked and the write happens on the same transaction, so two of them
	//   racing cannot both squeeze past the last free slot.
	// ═════════════════════════════════════════════════════════════════════════
	function withRoom<T>(write: (tx: DbClient) => Promise<T>): Promise<T> {
		return applicationRepository.withUserLock(userId, async (tx) => {
			await assertRoom(tx)

			return write(tx)
		})
	}

	async function createLetter(
		input: ApplicationInput,
		letter: string,
	): Promise<ApplicationDto> {
		const created = await withRoom((tx) =>
			applicationRepository.create(userId, { input, letter }, tx),
		)

		logger.info({ applicationId: created.id }, 'Application created')

		return toApplicationDto(created)
	}

	async function replaceLetter(
		applicationId: string,
		input: ApplicationInput,
		letter: string,
	): Promise<ApplicationDto> {
		const updated = await applicationRepository.updateLetter(
			userId,
			applicationId,
			{ input, letter },
		)

		if (!updated) {
			throw new NotFoundError(`Application ${applicationId} not found`)
		}

		logger.info({ applicationId }, 'Application regenerated')

		return toApplicationDto(updated)
	}

	const count = () => applicationRepository.countActive(userId)

	return {
		// ═════════════════════════════════════════════════════════════════════
		//   Would `saveLetter` accept this letter? Asked by the generation
		//   service BEFORE it spends anything on the model: the same rule, so
		//   a letter is never generated only to be refused at save time. It
		//   is re-checked at save, under the lock — this answer can go stale
		//   while the letter streams.
		// ═════════════════════════════════════════════════════════════════════
		async assertCanSave(applicationId?: string): Promise<void> {
			if (applicationId) await findOwned(applicationId)
			else await assertRoom()
		},

		count,

		async get(id: string): Promise<ApplicationDto> {
			return toApplicationDto(await findOwned(id))
		},

		async list({
			cursor,
			search = '',
		}: {
			cursor?: string
			search?: string
		}): Promise<ApplicationPage> {
			const rows = await applicationRepository.listActive(userId, {
				cursor,
				take: APPLICATIONS_PAGE_SIZE + 1,
				terms: searchTerms(search),
			})
			const items = rows.slice(0, APPLICATIONS_PAGE_SIZE)
			const hasMore = rows.length > APPLICATIONS_PAGE_SIZE

			return {
				items: items.map(toApplicationDto),
				nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null,
			}
		},

		async remove(id: string): Promise<void> {
			const deleted = await applicationRepository.softDelete(userId, id)

			if (!deleted) throw new NotFoundError(`Application ${id} not found`)

			logger.info({ applicationId: id }, 'Application deleted')
		},

		async restore(id: string): Promise<ApplicationDto> {
			const restored = await withRoom((tx) =>
				applicationRepository.restore(userId, id, tx),
			)

			if (!restored) {
				throw new NotFoundError(`Deleted application ${id} not found`)
			}

			logger.info({ applicationId: id }, 'Application restored')

			return toApplicationDto(restored)
		},

		// ═════════════════════════════════════════════════════════════════════
		//   Called by the generation service once a letter has streamed to
		//   completion: a regenerated letter replaces the letter and its input
		//   together, keeping the pair consistent; a new one needs room.
		// ═════════════════════════════════════════════════════════════════════
		saveLetter({
			applicationId,
			input,
			letter,
		}: SaveLetterCommand): Promise<ApplicationDto> {
			return applicationId
				? replaceLetter(applicationId, input, letter)
				: createLetter(input, letter)
		},

		async stats(): Promise<ApplicationStats> {
			return {
				goal: APPLICATION_GOAL,
				limit: entitlements.maxApplications,
				total: await count(),
			}
		},
	}
}

export type ApplicationService = ReturnType<typeof createApplicationService>
