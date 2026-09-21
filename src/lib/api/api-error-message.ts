import { type ApiError, readApiError } from './api-error'

export function apiErrorMessage(error: ApiError): string {
	switch (error.code) {
		case 'rate_limited':
			return error.retryAfterSeconds
				? `Too many letters at once. Try again in ${error.retryAfterSeconds} seconds.`
				: 'Too many letters at once. Try again in a minute.'
		case 'quota_exceeded':
			return 'You have used today’s letters on your plan. Come back tomorrow or upgrade to Pro for more.'
		case 'generation_in_progress':
			return 'A letter is already being written in another tab. Wait for it to finish.'
		case 'application_limit_reached':
			return 'You have reached the number of saved applications on your plan. Delete a few or upgrade to Pro.'
		case 'interrupted':
			return 'The connection dropped before the letter was finished. Nothing was saved — please try again.'
		case 'unavailable':
			return 'The writing service is unavailable right now. Please try again in a moment.'
		case 'save_failed':
			return 'The letter is ready but could not be saved. Copy it before leaving the page.'
		case 'network':
			return 'Could not reach the server. Check your internet connection and try again.'
		case 'unauthorized':
			return 'Your session has expired. Reload the page and sign in again.'
		case 'not_found':
			return 'This application no longer exists. It may have been deleted in another tab.'
		case 'invalid_request':
		case 'payload_too_large':
			return 'Some of the details could not be processed. Check the form and try again.'
		case 'plan_required':
			return 'This option is part of the Pro plan. Upgrade to use it.'
		case 'forbidden':
		case 'internal':
			return 'Something went wrong on our side. Please try again.'
	}
}

export function errorMessage(error: unknown): string {
	return apiErrorMessage(readApiError(error))
}
