import { asFunction } from 'awilix'
import { createApplicationRepository } from './application.repository.server'
import { createApplicationService } from './application.service.server'
import { createApplicationMaintenanceService } from './application-maintenance.service.server'

export const applicationsModule = {
	applicationMaintenanceService: asFunction(
		createApplicationMaintenanceService,
	).scoped(),
	applicationRepository: asFunction(createApplicationRepository).scoped(),
	applicationService: asFunction(createApplicationService).scoped(),
}
