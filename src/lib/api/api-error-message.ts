import { m } from '@/paraglide/messages'
import { type ApiError, readApiError } from './api-error'

// ═══════════════════════════════════════════════════════════════════════════
//   The sentence a person reads for each failure. Exhaustive by type: a new
//   error code does not compile until it has one.
// ═══════════════════════════════════════════════════════════════════════════
export function apiErrorMessage(error: ApiError): string {
	switch (error.code) {
		case 'rate_limited':
			return error.retryAfterSeconds
				? m['errors.rateLimitedIn']({ seconds: error.retryAfterSeconds })
				: m['errors.rateLimited']()
		case 'quota_exceeded':
			return m['errors.quotaExceeded']()
		case 'generation_in_progress':
			return m['errors.generationInProgress']()
		case 'application_limit_reached':
			return m['errors.applicationLimitReached']()
		case 'interrupted':
			return m['errors.interrupted']()
		case 'unavailable':
			return m['errors.unavailable']()
		case 'save_failed':
			return m['errors.saveFailed']()
		case 'network':
			return m['errors.network']()
		case 'unauthorized':
			return m['errors.unauthorized']()
		case 'not_found':
			return m['errors.notFound']()
		case 'invalid_request':
		case 'payload_too_large':
			return m['errors.invalidRequest']()
		case 'plan_required':
			return m['errors.planRequired']()
		case 'forbidden':
		case 'internal':
			return m['errors.internal']()
	}
}

export function errorMessage(error: unknown): string {
	return apiErrorMessage(readApiError(error))
}
