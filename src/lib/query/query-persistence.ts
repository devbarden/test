import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { hydrate, type Query, type QueryClient } from '@tanstack/react-query'
import {
	type PersistedClient,
	persistQueryClientSubscribe,
} from '@tanstack/react-query-persist-client'
import { CACHE_MAX_AGE_MS } from './query-client'

const CACHE_KEY_PREFIX = 'alt-shift:cache:'

const PERSIST_THROTTLE_MS = 500

export type PersistedQueries = {
	roots: readonly string[]
	version: string
}

// ═══════════════════════════════════════════════════════════════════════════
//   Restored synchronously: the async PersistQueryClientProvider let queries
//   fetch first, and the restored letters never reached the screen.
// ═══════════════════════════════════════════════════════════════════════════
export function restoreCache(
	queryClient: QueryClient,
	userId: string,
	persisted: PersistedQueries,
): void {
	const storage = getLocalStorage()
	const key = cacheKey(userId)
	const raw = storage?.getItem(key)

	if (!storage || !raw) return

	try {
		const stored = JSON.parse(raw) as PersistedClient
		const isCurrent =
			stored.buster === persisted.version &&
			Date.now() - stored.timestamp <= CACHE_MAX_AGE_MS

		if (!isCurrent) {
			storage.removeItem(key)
			return
		}

		hydrate(queryClient, stored.clientState)
		void queryClient.invalidateQueries({ refetchType: 'none' })
	} catch {
		storage.removeItem(key)
	}
}

export function persistCache(
	queryClient: QueryClient,
	userId: string,
	persisted: PersistedQueries,
): () => void {
	const storage = getLocalStorage()

	if (!storage) return () => {}

	return persistQueryClientSubscribe({
		buster: persisted.version,
		dehydrateOptions: {
			shouldDehydrateQuery: (query: Query) =>
				query.state.status === 'success' &&
				persisted.roots.includes(String(query.queryKey[0])),
		},
		persister: createSyncStoragePersister({
			key: cacheKey(userId),
			storage,
			throttleTime: PERSIST_THROTTLE_MS,
		}),
		queryClient,
	})
}

export function clearPersistedCaches(): void {
	const storage = getLocalStorage()

	if (!storage) return

	for (const key of Object.keys(storage)) {
		if (key.startsWith(CACHE_KEY_PREFIX)) storage.removeItem(key)
	}
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
