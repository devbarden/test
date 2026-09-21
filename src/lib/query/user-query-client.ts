import { dehydrate, hydrate, type QueryClient } from '@tanstack/react-query'
import { clearCaches, loadCache, saveCache } from './cache-storage'
import { createQueryClient } from './query-client'

const SAVE_DELAY_MS = 500

export type PersistedQueries = {
	roots: readonly string[]
	version: string
}

type Session = {
	queryClient: QueryClient
	stopSaving: () => void
	userId: string
}

let session: Session | undefined

// ═══════════════════════════════════════════════════════════════════════════
//   Owned outside React: the workspace remounts while Clerk settles its
//   session, and a remount must find the same cache. A different user gets
//   a fresh client; the previous user's saved cache stays theirs.
// ═══════════════════════════════════════════════════════════════════════════
export function getUserQueryClient(
	userId: string,
	persisted: PersistedQueries,
): QueryClient {
	if (session?.userId === userId) return session.queryClient

	endSession()

	const queryClient = createQueryClient()

	restore(queryClient, userId, persisted)
	session = {
		queryClient,
		stopSaving: saveOnChange(queryClient, userId, persisted),
		userId,
	}

	return queryClient
}

// ═══════════════════════════════════════════════════════════════════════════
//   Saving stops BEFORE storage is wiped, or a pending save writes the
//   signed-out user's letters back.
// ═══════════════════════════════════════════════════════════════════════════
export function disposeUserQueryClient(): void {
	endSession()
	clearCaches()
}

function endSession(): void {
	session?.stopSaving()
	session?.queryClient.clear()
	session = undefined
}

// ═══════════════════════════════════════════════════════════════════════════
//   Synchronous, before the first render, so the letters are on screen at
//   once instead of after a fetch; then marked stale, so each restored query
//   revalidates the first time it is used.
// ═══════════════════════════════════════════════════════════════════════════
function restore(
	queryClient: QueryClient,
	userId: string,
	{ version }: PersistedQueries,
): void {
	const state = loadCache(userId, version)

	if (!state) return

	hydrate(queryClient, state)
	void queryClient.invalidateQueries({ refetchType: 'none' })
}

function saveOnChange(
	queryClient: QueryClient,
	userId: string,
	{ roots, version }: PersistedQueries,
): () => void {
	let timer: ReturnType<typeof setTimeout> | undefined

	const save = () => {
		timer = undefined
		saveCache(
			userId,
			version,
			dehydrate(queryClient, {
				shouldDehydrateQuery: (query) =>
					query.state.status === 'success' &&
					roots.includes(String(query.queryKey[0])),
			}),
		)
	}

	const unsubscribe = queryClient.getQueryCache().subscribe(() => {
		timer ??= setTimeout(save, SAVE_DELAY_MS)
	})

	return () => {
		clearTimeout(timer)
		unsubscribe()
	}
}
