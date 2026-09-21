import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { type ApiErrorCode, readApiError } from '../api/api-error'

const RETRYABLE: ReadonlySet<ApiErrorCode> = new Set([
	'network',
	'unavailable',
	'internal',
])

const MAX_RETRIES = 2

const STALE_TIME_MS = 30_000

export const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

// ═══════════════════════════════════════════════════════════════════════════
//   A 401 on any call means the session is gone (signed out in another tab,
//   expired, revoked). A full navigation to the sign-in page is the one
//   response that recovers every screen at once.
// ═══════════════════════════════════════════════════════════════════════════
export function redirectToSignIn(): void {
	window.location.assign('/sign-in')
}

function redirectIfUnauthorized(error: unknown): void {
	if (readApiError(error).code === 'unauthorized') redirectToSignIn()
}

// ═══════════════════════════════════════════════════════════════════════════
//   Retries only what a retry can fix — a flaky network, a restarting
//   instance. A 404, a validation error or a rate limit is an answer, and
//   asking again only delays showing it (or, for 429, makes it worse).
//
//   `gcTime` is Infinity: a query restored from storage must not be
//   collected before a component subscribes to it, or it is also dropped
//   from what is written back. The persisted cache's own lifetime is still
//   bounded by CACHE_MAX_AGE_MS when it is read (restoreCache). A finite
//   30-day gcTime looked equivalent and was not — it exceeds setTimeout's
//   2^31-1 ms ceiling, browsers fire such a timer almost immediately, and
//   every restored query was garbage-collected on arrival.
// ═══════════════════════════════════════════════════════════════════════════
export function createQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			mutations: { retry: false },
			queries: {
				gcTime: Number.POSITIVE_INFINITY,
				retry: (failureCount, error) =>
					failureCount < MAX_RETRIES && RETRYABLE.has(readApiError(error).code),
				staleTime: STALE_TIME_MS,
			},
		},
		mutationCache: new MutationCache({ onError: redirectIfUnauthorized }),
		queryCache: new QueryCache({ onError: redirectIfUnauthorized }),
	})
}
