import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { type ApiErrorCode, readApiError } from './api-error'

const RETRYABLE: ReadonlySet<ApiErrorCode> = new Set([
	'network',
	'unavailable',
	'internal',
])

const MAX_RETRIES = 2

export const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

// ═══════════════════════════════════════════════════════════════════════════
//   A 401 on any call means the session is gone (signed out in another tab,
//   expired, revoked). A full navigation to the sign-in page is the one
//   response that recovers every screen at once.
// ═══════════════════════════════════════════════════════════════════════════
function onError(error: unknown) {
	if (readApiError(error).code === 'unauthorized') {
		window.location.assign('/sign-in')
	}
}

// ═══════════════════════════════════════════════════════════════════════════
//   Retries only what a retry can fix — a flaky network, a restarting
//   instance. A 404, a validation error or a rate limit is an answer, and
//   asking again only delays showing it (or, for 429, makes it worse).
//
//   `gcTime` matches the persisted cache's lifetime: a query collected from
//   memory is also dropped from what is written to storage.
// ═══════════════════════════════════════════════════════════════════════════
export function createQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			mutations: { retry: false },
			queries: {
				gcTime: CACHE_MAX_AGE_MS,
				retry: (failureCount, error) =>
					failureCount < MAX_RETRIES && RETRYABLE.has(readApiError(error).code),
				staleTime: 30_000,
			},
		},
		mutationCache: new MutationCache({ onError }),
		queryCache: new QueryCache({ onError }),
	})
}
