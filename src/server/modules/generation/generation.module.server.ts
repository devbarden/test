import { asFunction } from 'awilix'
import { createGenerationService } from './generation.service.server'

export const generationModule = {
	generationService: asFunction(createGenerationService).scoped(),
}
