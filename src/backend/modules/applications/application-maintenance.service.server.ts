import type { Logger } from '@/backend/observability/logger.server'
import type { ApplicationRepository } from './application.repository.server'

export function createApplicationMaintenanceService({
	applicationRepository,
	logger,
}: {
	applicationRepository: ApplicationRepository
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
	}
}

export type ApplicationMaintenanceService = ReturnType<
	typeof createApplicationMaintenanceService
>
