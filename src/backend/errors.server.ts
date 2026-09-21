import { ZodError } from 'zod'
import type { ApiError, ApiErrorCode } from '@/lib/api-error'

type AppErrorOptions = ErrorOptions & { retryAfterSeconds?: number }

// ═══════════════════════════════════════════════════════════════════════════
//   Every failure the backend means to report is an AppError: a public code
//   and an HTTP status. The message is for the log only — it may name a
//   table, an upstream request id, a stack of causes — and it never leaves
//   the process: `toPayload` is the only thing a client ever sees.
// ═══════════════════════════════════════════════════════════════════════════
export class AppError extends Error {
	readonly code: ApiErrorCode
	readonly retryAfterSeconds: number | undefined
	readonly statusCode: number

	constructor(
		code: ApiErrorCode,
		statusCode: number,
		message: string = code,
		{ retryAfterSeconds, ...options }: AppErrorOptions = {},
	) {
		super(message, options)
		this.name = 'AppError'
		this.code = code
		this.statusCode = statusCode
		this.retryAfterSeconds = retryAfterSeconds
	}

	toPayload(): ApiError {
		return this.retryAfterSeconds
			? { code: this.code, retryAfterSeconds: this.retryAfterSeconds }
			: { code: this.code }
	}
}

export class UnauthorizedError extends AppError {
	constructor() {
		super('unauthorized', 401)
	}
}

export class ForbiddenError extends AppError {
	constructor(message = 'forbidden') {
		super('forbidden', 403, message)
	}
}

export class PlanRequiredError extends AppError {
	constructor(message = 'plan_required') {
		super('plan_required', 403, message)
	}
}

export class NotFoundError extends AppError {
	constructor(message = 'not_found') {
		super('not_found', 404, message)
	}
}

export class ValidationError extends AppError {
	constructor(message = 'invalid_request', options?: ErrorOptions) {
		super('invalid_request', 400, message, options)
	}
}

export class PayloadTooLargeError extends AppError {
	constructor() {
		super('payload_too_large', 413)
	}
}

export class RateLimitError extends AppError {
	constructor(
		code: 'rate_limited' | 'quota_exceeded',
		retryAfterSeconds: number,
		message: string = code,
	) {
		super(code, 429, message, { retryAfterSeconds })
	}
}

export class ConflictError extends AppError {
	constructor(code: 'generation_in_progress' | 'application_limit_reached') {
		super(code, 409)
	}
}

export class UpstreamError extends AppError {
	constructor(
		code: 'unavailable' | 'interrupted' | 'rate_limited',
		message: string,
		options?: AppErrorOptions,
	) {
		super(code, code === 'rate_limited' ? 429 : 502, message, options)
	}
}

// ═══════════════════════════════════════════════════════════════════════════
//   Collapses anything thrown into an AppError. A ZodError is a request the
//   client got wrong; everything else is ours, reported as `internal` with
//   the original kept as `cause` for the log.
// ═══════════════════════════════════════════════════════════════════════════
export function toAppError(error: unknown): AppError {
	if (error instanceof AppError) return error

	if (error instanceof ZodError) {
		return new ValidationError('Request failed validation', { cause: error })
	}

	return new AppError('internal', 500, 'Unhandled error', { cause: error })
}

// ═══════════════════════════════════════════════════════════════════════════
//   What a server function throws across the RPC boundary. The serializer
//   copies every own property of the thrown object to the browser, so the
//   original is never rethrown: a fresh Error carrying only the payload is.
// ═══════════════════════════════════════════════════════════════════════════
export function toClientError(error: AppError): Error {
	return new Error(JSON.stringify(error.toPayload()))
}

export function errorResponse(
	error: AppError,
	headers: HeadersInit = {},
): Response {
	const responseHeaders = new Headers(headers)

	responseHeaders.set('Cache-Control', 'no-store')

	if (error.retryAfterSeconds) {
		responseHeaders.set('Retry-After', String(error.retryAfterSeconds))
	}

	return Response.json(
		{ error: error.toPayload() },
		{ headers: responseHeaders, status: error.statusCode },
	)
}
