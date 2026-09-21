import type { QueryClient } from '@tanstack/react-query'
import { createQueryClient } from './query-client'
import { persistCache, restoreCache } from './query-persistence'

type UserQueryClient = {
	queryClient: QueryClient
	stopPersisting: () => void
	userId: string
}

let current: UserQueryClient | undefined

// ═══════════════════════════════════════════════════════════════════════════
//   One query client per signed-in user for the life of the page — owned
//   here, not by component state, because the workspace can mount more than
//   once while Clerk settles its session on load, and a remount must find
//   the same cache instead of a fresh, empty one.
//
//   The client is born with the user's persisted cache already restored, and
//   only then starts persisting, so nothing is ever written from a client
//   that has not read what was stored. A different user replaces it and the
//   old one is cleared, so no frame of the previous account's letters can
//   survive in memory.
// ═══════════════════════════════════════════════════════════════════════════
export function getUserQueryClient(userId: string): QueryClient {
	if (current?.userId !== userId) {
		current?.stopPersisting()
		current?.queryClient.clear()

		const queryClient = createQueryClient()

		restoreCache(queryClient, userId)
		current = {
			queryClient,
			stopPersisting: persistCache(queryClient, userId),
			userId,
		}
	}

	return current.queryClient
}
