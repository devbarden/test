import { z } from 'zod'
import {
	applicationDtoSchema,
	applicationInputSchema,
} from '@/features/applications/application.schema'
import { apiErrorSchema } from '@/lib/api-error'

export const GENERATION_ENDPOINT = '/api/generate'

// ═══════════════════════════════════════════════════════════════════════════
//   What the browser asks for: the four form fields, plus the id of the
//   application to regenerate ("Try Again"), or none for a new one. The
//   prompt is NOT part of the contract — it is built on the server, so the
//   endpoint cannot be used as an open proxy to the model.
// ═══════════════════════════════════════════════════════════════════════════
export const generateCommandSchema = z.object({
	applicationId: z.uuid().optional(),
	input: applicationInputSchema,
})

export type GenerateCommand = z.infer<typeof generateCommandSchema>

// ═══════════════════════════════════════════════════════════════════════════
//   The stream the browser reads: newline-delimited JSON, one event per
//   line, ending in exactly one `done` or `error`.
//
//   `done` carries the application as SAVED — the server persists the letter
//   before announcing completion, so "done" means "safe", and the client
//   never has to make a second call that could fail after the user has
//   already seen the letter. Errors known before the first byte are a plain
//   HTTP error with `{ error }`; once the 200 is on the wire a failure can
//   only be told as an `error` event.
// ═══════════════════════════════════════════════════════════════════════════
export const generationEventSchema = z.discriminatedUnion('type', [
	z.object({ text: z.string(), type: z.literal('delta') }),
	z.object({ application: applicationDtoSchema, type: z.literal('done') }),
	z.object({ error: apiErrorSchema, type: z.literal('error') }),
])

export type GenerationEvent = z.infer<typeof generationEventSchema>
