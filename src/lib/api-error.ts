import { z } from 'zod'

// ═══════════════════════════════════════════════════════════════════════════
//   The one vocabulary of failure shared by every layer: the backend throws
//   it, the /api routes send it as `{ error }`, server functions carry it in
//   the error message, the generation stream emits it as an event, and the
//   UI maps it to a sentence. A code is a contract — add one here and the
//   compiler points at every switch that has to learn about it.
//
//   `network` is the only code the server never sends: it is what the
//   browser concludes when the request never reached the server at all.
// ═══════════════════════════════════════════════════════════════════════════
export const apiErrorCodeSchema = z.enum([
	'unauthorized',
	'forbidden',
	'not_found',
	'invalid_request',
	'payload_too_large',
	'rate_limited',
	'quota_exceeded',
	'generation_in_progress',
	'application_limit_reached',
	'plan_required',
	'unavailable',
	'interrupted',
	'save_failed',
	'internal',
	'network',
])

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>

export const apiErrorSchema = z.object({
	code: apiErrorCodeSchema,
	retryAfterSeconds: z.number().int().positive().optional(),
})

export type ApiError = z.infer<typeof apiErrorSchema>

export const apiErrorBodySchema = z.object({ error: apiErrorSchema })

const INTERNAL: ApiError = { code: 'internal' }

// ═══════════════════════════════════════════════════════════════════════════
//   Server functions deliver a thrown error to the browser as an Error whose
//   message the backend set to the JSON payload (see toClientError). Anything
//   else — a fetch that failed outright, a message some library wrote — is
//   classified here, so a component never parses an error message itself.
// ═══════════════════════════════════════════════════════════════════════════
export function readApiError(error: unknown): ApiError {
	if (error instanceof TypeError) return { code: 'network' }
	if (!(error instanceof Error)) return INTERNAL

	try {
		const parsed = apiErrorSchema.safeParse(JSON.parse(error.message))

		return parsed.success ? parsed.data : INTERNAL
	} catch {
		return INTERNAL
	}
}
