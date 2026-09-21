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

export function redirectToSignIn(): void {
	window.location.assign('/sign-in')
}

function redirectIfUnauthorized(error: unknown): void {
	if (readApiError(error).code === 'unauthorized') redirectToSignIn()
}

// ═══════════════════════════════════════════════════════════════════════════
//   gcTime is Infinity: a 30-day value exceeds setTimeout's 2^31-1 ms, fires
//   at once and collects every restored query.
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
