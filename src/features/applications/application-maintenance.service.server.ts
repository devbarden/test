import type { AppConfig } from '@/backend/config.server'
import type { Logger } from '@/backend/observability/logger.server'
import type { ApplicationRepository } from './application.repository.server'

const DAY_MS = 24 * 60 * 60 * 1000

// ═══════════════════════════════════════════════════════════════════════════
//   Operations that act on behalf of the SYSTEM rather than a signed-in
//   user — the scheduled purge and the Clerk webhook — so they take the
//   user id as an argument and are only reachable from a system scope.
// ═══════════════════════════════════════════════════════════════════════════
export function createApplicationMaintenanceService({
	applicationRepository,
	config,
	logger,
}: {
	applicationRepository: ApplicationRepository
	config: AppConfig
	logger: Logger
}) {
	return {
		async eraseUser(userId: string): Promise<number> {
			const count = await applicationRepository.deleteAllForUser(userId)

			logger.info(
				{ count, userId },
				'Erased all applications of a deleted user',
			)

			return count
		},

		async purgeDeleted(now = new Date()): Promise<number> {
			const cutoff = new Date(
				now.getTime() - config.limits.deletedRetentionDays * DAY_MS,
			)
			const count = await applicationRepository.purgeDeletedBefore(cutoff)

			logger.info({ count, cutoff }, 'Purged soft-deleted applications')

			return count
		},
	}
}

export type ApplicationMaintenanceService = ReturnType<
	typeof createApplicationMaintenanceService
>
