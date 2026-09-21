import { z } from 'zod'

// ═══════════════════════════════════════════════════════════════════════════
//   The wire contract between /api/generate and the browser.
//
//   The upstream speaks SSE, and it does not quite speak it as documented
//   (see the README). The browser is not exposed to that: the server
//   normalises it into newline-delimited JSON with an EXPLICIT terminal
//   event. That matters for one decision above all — a letter is saved only
//   after `done`. A stream that simply stops could be a finished letter or
//   a connection that dropped mid-sentence, and a truncated letter must
//   never count toward the user's goal.
//
//   Errors that are known before the first byte (auth, validation, rate
//   limit, upstream refusing the call) are a plain JSON body with a real
//   HTTP status. Once the 200 is on the wire, a failure can only be told as
//   an `error` event.
// ═══════════════════════════════════════════════════════════════════════════
export const generationErrorCodeSchema = z.enum([
	'unauthorized',
	'invalid_request',
	'rate_limited',
	'unavailable',
	'interrupted',
])

export type GenerationErrorCode = z.infer<typeof generationErrorCodeSchema>

export const generationErrorSchema = z.object({
	code: generationErrorCodeSchema,
	retryAfterSeconds: z.number().int().positive().optional(),
})

export type GenerationError = z.infer<typeof generationErrorSchema>

export const generationErrorBodySchema = z.object({
	error: generationErrorSchema,
})

export const generationEventSchema = z.discriminatedUnion('type', [
	z.object({ text: z.string(), type: z.literal('delta') }),
	z.object({ type: z.literal('done') }),
	z.object({ error: generationErrorSchema, type: z.literal('error') }),
])

export type GenerationEvent = z.infer<typeof generationEventSchema>

export const GENERATION_ENDPOINT = '/api/generate'
