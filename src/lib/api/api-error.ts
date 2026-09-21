import { z } from 'zod'

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
