import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { type ApiErrorCode, readApiError } from '../api/api-error'

const RETRYABLE: ReadonlySet<ApiErrorCode> = new Set(['network', 'unavailable', 'internal'])

const MAX_RETRIES = 2

const STALE_TIME_MS = 30_000

export function redirectToSignIn(): void {
	window.location.assign('/sign-in')
}

function redirectIfUnauthorized(error: unknown): void {
	if (readApiError(error).code === 'unauthorized') redirectToSignIn()
}

// ═══════════════════════════════════════════════════════════════════════════
//   gcTime is Infinity: a persisted list collected while no screen shows it
//   would drop out of the next snapshot.
// ═══════════════════════════════════════════════════════════════════════════
export function createQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			mutations: { retry: false },
			queries: {
				gcTime: Number.POSITIVE_INFINITY,
				retry: (failureCount, error) => failureCount < MAX_RETRIES && RETRYABLE.has(readApiError(error).code),
				staleTime: STALE_TIME_MS,
			},
		},
		mutationCache: new MutationCache({ onError: redirectIfUnauthorized }),
		queryCache: new QueryCache({ onError: redirectIfUnauthorized }),
	})
}
