import { dehydrate, hashKey, hydrate, type InfiniteData, type QueryClient, type QueryKey } from '@tanstack/react-query'
import { clearCaches, loadCache, saveCache } from './cache-storage'
import { createQueryClient } from './query-client'

const SAVE_DELAY_MS = 500

export type PersistedQueries = {
	keys: readonly QueryKey[]
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
export function getUserQueryClient(userId: string, persisted: PersistedQueries): QueryClient {
	if (session?.userId !== userId) {
		endSession()
		session = startSession(userId, persisted)
	}

	return session.queryClient
}

// ═══════════════════════════════════════════════════════════════════════════
//   Saving stops BEFORE storage is wiped, or a pending save writes the
//   signed-out user's letters back.
// ═══════════════════════════════════════════════════════════════════════════
export function disposeUserQueryClient(): void {
	endSession()
	clearCaches()
}

// ═══════════════════════════════════════════════════════════════════════════
//   Restored synchronously, before the first render, so the letters are on
//   screen at once; then marked stale, so each revalidates on first use.
// ═══════════════════════════════════════════════════════════════════════════
function startSession(userId: string, persisted: PersistedQueries): Session {
	const queryClient = createQueryClient()
	const saved = loadCache(userId, persisted.version)

	if (saved) {
		hydrate(queryClient, saved)
		queryClient.invalidateQueries({ refetchType: 'none' })
	}

	return {
		queryClient,
		stopSaving: saveOnChange(queryClient, userId, persisted),
		userId,
	}
}

function endSession(): void {
	session?.stopSaving()
	session?.queryClient.clear()
	session = undefined
}

function saveOnChange(queryClient: QueryClient, userId: string, { keys, version }: PersistedQueries): () => void {
	const queryCache = queryClient.getQueryCache()
	const hashes = new Set(keys.map(hashKey))
	let timer: ReturnType<typeof setTimeout> | undefined

	const save = () => {
		clearTimeout(timer)
		timer = undefined

		const queries = queryCache.getAll().filter((query) => hashes.has(query.queryHash))

		// ═════════════════════════════════════════════════════════════════════
		//   A failed revalidation (offline, server down) keeps the last good
		//   snapshot: saving now would drop the list from it.
		// ═════════════════════════════════════════════════════════════════════
		if (queries.some((query) => query.state.status === 'error')) return

		saveCache(
			userId,
			version,
			dehydrate(queryClient, {
				serializeData: firstPageOnly,
				shouldDehydrateQuery: (query) => queries.includes(query) && query.state.status === 'success',
			}),
		)
	}
	const flush = () => {
		if (timer) save()
	}

	const unsubscribe = queryCache.subscribe(({ query }) => {
		if (hashes.has(query.queryHash)) timer ??= setTimeout(save, SAVE_DELAY_MS)
	})

	window.addEventListener('pagehide', flush)

	return () => {
		clearTimeout(timer)
		unsubscribe()
		window.removeEventListener('pagehide', flush)
	}
}

// ═══════════════════════════════════════════════════════════════════════════
//   An infinite query is saved at its first page: a tab reopens at the top
//   and scrolls the rest in, while every page scrolled through would grow
//   the snapshot towards the storage quota and lengthen the refetch that
//   revalidates it.
// ═══════════════════════════════════════════════════════════════════════════
function firstPageOnly(data: unknown): unknown {
	if (!isInfiniteData(data)) return data

	return {
		pageParams: data.pageParams.slice(0, 1),
		pages: data.pages.slice(0, 1),
	}
}

function isInfiniteData(data: unknown): data is InfiniteData<unknown> {
	return (
		typeof data === 'object' &&
		data !== null &&
		'pages' in data &&
		Array.isArray(data.pages) &&
		'pageParams' in data &&
		Array.isArray(data.pageParams)
	)
}
