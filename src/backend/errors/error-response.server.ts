import type { AppError } from './app-error.server'

// ═══════════════════════════════════════════════════════════════════════════
//   The two ways an AppError leaves the process — and the only two. Both
//   carry the public payload and nothing else.
//
//   errorResponse   an HTTP answer: `{ error }` with the real status and a
//                   Retry-After when there is one
//   toClientError   what a server function throws across the RPC boundary.
//                   The serializer copies every own property of the thrown
//                   object to the browser (stack, cause, Prisma metadata),
//                   so the original is never rethrown: a fresh Error whose
//                   message is the payload is (see readApiError)
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
