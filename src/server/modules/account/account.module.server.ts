import { asFunction } from 'awilix'
import { createAccountEventsService } from './account-events.service.server'

export const accountModule = {
	accountEventsService: asFunction(createAccountEventsService).scoped(),
}
