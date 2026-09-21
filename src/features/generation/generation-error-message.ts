import type { LetterGenerationError } from './generation-client'

export function generationErrorMessage(error: LetterGenerationError): string {
	switch (error.code) {
		case 'rate_limited':
			return error.retryAfterSeconds
				? `You are generating letters faster than the service allows. Try again in ${error.retryAfterSeconds} seconds.`
				: 'You are generating letters faster than the service allows. Try again in a minute.'
		case 'interrupted':
			return 'The connection dropped before the letter was finished. Nothing was saved — please try again.'
		case 'unavailable':
			return 'The writing service is unavailable right now. Please try again in a moment.'
		case 'network':
			return 'Could not reach the server. Check your internet connection and try again.'
		case 'unauthorized':
			return 'Your session has expired. Reload the page and sign in again.'
		case 'invalid_request':
			return 'Some of the details could not be processed. Check the form and try again.'
		case 'not_saved':
			return 'The letter is ready but could not be saved in this browser — its storage may be full. Copy it before leaving the page.'
	}
}
