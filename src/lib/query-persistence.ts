import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { hydrate, type Query, type QueryClient } from '@tanstack/react-query'
import {
	type PersistedClient,
	persistQueryClientSubscribe,
} from '@tanstack/react-query-persist-client'
import { CACHE_MAX_AGE_MS } from './query-client'

const CACHE_KEY_PREFIX = 'alt-shift:cache:'

// ═══════════════════════════════════════════════════════════════════════════
//   Bumped whenever the shape of cached data changes: a persisted cache
//   written by an older build is then discarded instead of being fed to
//   components that expect the new shape.
// ═══════════════════════════════════════════════════════════════════════════
const CACHE_BUSTER = 'applications-v1'

// ═══════════════════════════════════════════════════════════════════════════
//   The server is the source of truth; this is how letters are ALSO
//   restored "by means of the browser": the query cache is written to
//   localStorage, per user, and read back on the next visit before the
//   first render. The dashboard therefore paints the letters immediately —
//   and still shows them when the API cannot be reached — then revalidates.
//
//   Restored queries are marked stale at once. What was persisted may be
//   seconds old and still inside staleTime, and it may predate the last
//   change (the throttled write missed an Undo right before a reload): the
//   cached letters are painted, and every query revalidates as it mounts.
//
//   Restoring is synchronous on purpose. localStorage is synchronous, so the
//   cache can be filled before any component mounts; the asynchronous
//   restore of PersistQueryClientProvider left a window in which queries
//   started fetching and the restored letters never reached the screen.
// ═══════════════════════════════════════════════════════════════════════════
export function restoreCache(queryClient: QueryClient, userId: string): void {
	const storage = getLocalStorage()
	const key = cacheKey(userId)
	const raw = storage?.getItem(key)

	if (!storage || !raw) return

	try {
		const persisted = JSON.parse(raw) as PersistedClient
		const isCurrent =
			persisted.buster === CACHE_BUSTER &&
			Date.now() - persisted.timestamp <= CACHE_MAX_AGE_MS

		if (!isCurrent) {
			storage.removeItem(key)
			return
		}

		hydrate(queryClient, persisted.clientState)
		void queryClient.invalidateQueries({ refetchType: 'none' })
	} catch {
		storage.removeItem(key)
	}
}

// ═══════════════════════════════════════════════════════════════════════════
//   Writes successful application queries back to storage as they change,
//   throttled. Returns the unsubscribe function. Without localStorage (Safari
//   with storage blocked, some webviews) nothing is written and the app
//   simply works from the network.
// ═══════════════════════════════════════════════════════════════════════════
export function persistCache(
	queryClient: QueryClient,
	userId: string,
): () => void {
	const storage = getLocalStorage()

	if (!storage) return () => {}

	return persistQueryClientSubscribe({
		buster: CACHE_BUSTER,
		dehydrateOptions: { shouldDehydrateQuery },
		persister: createSyncStoragePersister({
			key: cacheKey(userId),
			storage,
			throttleTime: 500,
		}),
		queryClient,
	})
}

// ═══════════════════════════════════════════════════════════════════════════
//   Signing out removes every user's cached letters from this browser: on a
//   shared computer, the next person must not find the previous one's
//   letters in storage.
// ═══════════════════════════════════════════════════════════════════════════
export function clearPersistedCaches(): void {
	const storage = getLocalStorage()

	if (!storage) return

	for (const key of Object.keys(storage)) {
		if (key.startsWith(CACHE_KEY_PREFIX)) storage.removeItem(key)
	}
}

function shouldDehydrateQuery(query: Query): boolean {
	return (
		query.state.status === 'success' && query.queryKey[0] === 'applications'
	)
}

function cacheKey(userId: string): string {
	return `${CACHE_KEY_PREFIX}${userId}`
}

function getLocalStorage(): Storage | undefined {
	try {
		const probe = `${CACHE_KEY_PREFIX}probe`

		window.localStorage.setItem(probe, probe)
		window.localStorage.removeItem(probe)

		return window.localStorage
	} catch {
		return undefined
	}
}
