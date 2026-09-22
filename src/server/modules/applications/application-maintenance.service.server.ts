import type { Logger } from '@/server/observability/logger.server'
import type { ApplicationRepository } from './application.repository.server'

type Deps = {
	applicationRepository: ApplicationRepository
	logger: Logger
}

export function createApplicationMaintenanceService({ applicationRepository, logger }: Deps) {
	return {
		async eraseUser(userId: string): Promise<number> {
			const count = await applicationRepository.deleteAllForUser(userId)

			logger.info({ count, userId }, 'Erased all applications of a deleted user')

			return count
		},
	}
}

export type ApplicationMaintenanceService = ReturnType<typeof createApplicationMaintenanceService>
