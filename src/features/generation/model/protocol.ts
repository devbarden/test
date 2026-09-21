import { z } from 'zod'
import {
	applicationDtoSchema,
	applicationInputSchema,
} from '@/features/applications/model/application.schema'
import { apiErrorSchema } from '@/lib/api/api-error'

export const GENERATION_ENDPOINT = '/api/generate'

export const generateCommandSchema = z.object({
	applicationId: z.uuid().optional(),
	input: applicationInputSchema,
})

export type GenerateCommand = z.infer<typeof generateCommandSchema>

export const generationEventSchema = z.discriminatedUnion('type', [
	z.object({ text: z.string(), type: z.literal('delta') }),
	z.object({ type: z.literal('saving') }),
	z.object({ application: applicationDtoSchema, type: z.literal('done') }),
	z.object({ error: apiErrorSchema, type: z.literal('error') }),
])

export type GenerationEvent = z.infer<typeof generationEventSchema>
