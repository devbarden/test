import type { QueryClient } from '@tanstack/react-query'
import { createQueryClient } from './query-client'
import {
	clearPersistedCaches,
	type PersistedQueries,
	persistCache,
	restoreCache,
} from './query-persistence'

type UserQueryClient = {
	queryClient: QueryClient
	stopPersisting: () => void
	userId: string
}

let current: UserQueryClient | undefined

// ═══════════════════════════════════════════════════════════════════════════
//   Owned outside React: the workspace remounts while Clerk settles its
//   session, and a remount must find the same cache.
// ═══════════════════════════════════════════════════════════════════════════
export function getUserQueryClient(
	userId: string,
	persisted: PersistedQueries,
): QueryClient {
	if (current?.userId !== userId) {
		current?.stopPersisting()
		current?.queryClient.clear()

		const queryClient = createQueryClient()

		restoreCache(queryClient, userId, persisted)
		current = {
			queryClient,
			stopPersisting: persistCache(queryClient, userId, persisted),
			userId,
		}
	}

	return current.queryClient
}

// ═══════════════════════════════════════════════════════════════════════════
//   The persister stops BEFORE storage is wiped, or a scheduled save writes
//   the signed-out user's letters back.
// ═══════════════════════════════════════════════════════════════════════════
export function disposeUserQueryClient(): void {
	current?.stopPersisting()
	current?.queryClient.clear()
	current = undefined
	clearPersistedCaches()
}
