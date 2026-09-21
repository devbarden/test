import type { AppError } from './app-error.server'

// ═══════════════════════════════════════════════════════════════════════════
//   The RPC serializer copies every own property of a thrown object, so only
//   a fresh Error carrying the payload is thrown.
// ═══════════════════════════════════════════════════════════════════════════
export function errorResponse(error: AppError): Response {
	const headers = new Headers({ 'Cache-Control': 'no-store' })

	if (error.retryAfterSeconds) {
		headers.set('Retry-After', String(error.retryAfterSeconds))
	}

	return Response.json(
		{ error: error.toPayload() },
		{ headers, status: error.statusCode },
	)
}

export function toClientError(error: AppError): Error {
	return new Error(JSON.stringify(error.toPayload()))
}
