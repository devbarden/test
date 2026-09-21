import type { AppConfig } from '@/backend/config.server'
import type { UserActor } from '@/backend/di/actor'
import { ConflictError, NotFoundError } from '@/backend/errors.server'
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
} from './application.schema'

type ApplicationServiceDeps = {
	applicationRepository: ApplicationRepository
	config: AppConfig
	logger: Logger
	userActor: UserActor
}

type SaveLetterCommand = {
	applicationId?: string
	input: ApplicationInput
	letter: string
}

// ═══════════════════════════════════════════════════════════════════════════
//   The signed-in user's letters. The user comes from the request scope
//   (`userActor`), never from an argument, so no caller can ask for someone
//   else's data by passing a different id.
// ═══════════════════════════════════════════════════════════════════════════
export function createApplicationService({
	applicationRepository,
	config,
	logger,
	userActor,
}: ApplicationServiceDeps) {
	const { userId } = userActor

	async function getOwned(id: string) {
		const application = await applicationRepository.findActive(userId, id)

		if (!application) throw new NotFoundError(`Application ${id} not found`)

		return application
	}

	return {
		async assertCanCreate(): Promise<void> {
			const total = await applicationRepository.countActive(userId)

			if (total >= config.limits.applicationsPerUser) {
				throw new ConflictError('application_limit_reached')
			}
		},

		async get(id: string): Promise<ApplicationDto> {
			return toApplicationDto(await getOwned(id))
		},

		async list({ cursor }: { cursor?: string }): Promise<ApplicationPage> {
			const rows = await applicationRepository.listActive(userId, {
				cursor,
				take: APPLICATIONS_PAGE_SIZE + 1,
			})
			const items = rows.slice(0, APPLICATIONS_PAGE_SIZE)

			return {
				items: items.map(toApplicationDto),
				nextCursor:
					rows.length > APPLICATIONS_PAGE_SIZE
						? (items.at(-1)?.id ?? null)
						: null,
			}
		},

		async remove(id: string): Promise<void> {
			const deleted = await applicationRepository.softDelete(userId, id)

			if (!deleted) throw new NotFoundError(`Application ${id} not found`)

			logger.info({ applicationId: id }, 'Application deleted')
		},

		async restore(id: string): Promise<ApplicationDto> {
			const restored = await applicationRepository.withUserLock(
				userId,
				async (tx) => {
					const total = await applicationRepository.countActive(userId, tx)

					if (total >= config.limits.applicationsPerUser) {
						throw new ConflictError('application_limit_reached')
					}

					return applicationRepository.restore(userId, id)
				},
			)

			if (!restored)
				throw new NotFoundError(`Deleted application ${id} not found`)

			return toApplicationDto(restored)
		},

		// ═════════════════════════════════════════════════════════════════════
		//   Called by the generation service once a letter has streamed to
		//   completion. A new letter is inserted under the per-user lock so the
		//   cap cannot be raced; a regenerated one replaces the letter and the
		//   input together, keeping the pair consistent.
		// ═════════════════════════════════════════════════════════════════════
		async saveLetter({
			applicationId,
			input,
			letter,
		}: SaveLetterCommand): Promise<ApplicationDto> {
			if (applicationId) {
				const updated = await applicationRepository.updateLetter(
					userId,
					applicationId,
					{ input, letter },
				)

				if (!updated) {
					throw new NotFoundError(`Application ${applicationId} not found`)
				}

				return toApplicationDto(updated)
			}

			const created = await applicationRepository.withUserLock(
				userId,
				async (tx) => {
					const total = await applicationRepository.countActive(userId, tx)

					if (total >= config.limits.applicationsPerUser) {
						throw new ConflictError('application_limit_reached')
					}

					return applicationRepository.create(userId, { input, letter }, tx)
				},
			)

			logger.info({ applicationId: created.id }, 'Application created')

			return toApplicationDto(created)
		},

		async stats(): Promise<ApplicationStats> {
			return {
				goal: APPLICATION_GOAL,
				total: await applicationRepository.countActive(userId),
			}
		},
	}
}

export type ApplicationService = ReturnType<typeof createApplicationService>
