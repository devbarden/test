import { setResponseStatus } from '@tanstack/react-start/server'
import type { AppError } from './app-error.server'

export function errorResponse(error: AppError): Response {
	const headers = new Headers({ 'Cache-Control': 'no-store' })

	if (error.retryAfterSeconds) {
		headers.set('Retry-After', String(error.retryAfterSeconds))
	}

	return Response.json({ error: error.toPayload() }, { headers, status: error.statusCode })
}

// ═══════════════════════════════════════════════════════════════════════════
//   TanStack answers a failed server function with 200 unless told
//   otherwise, so the real status is set for logs, metrics and proxies.
//   The RPC serializer copies every own property of a thrown object, so
//   only a fresh Error carries the payload.
// ═══════════════════════════════════════════════════════════════════════════
export function toServerFnError(error: AppError): Error {
	setResponseStatus(error.statusCode)

	return new Error(JSON.stringify(error.toPayload()))
}
