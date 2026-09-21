import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type { PersistedQueries } from '@/lib/query/query-persistence'
import type {
	ApplicationDto,
	ApplicationPage,
	ApplicationStats,
} from '../model/application.schema'
import { matchesSearch } from '../model/application-search'
import { applicationKeys } from './application.queries'

type ApplicationList = InfiniteData<ApplicationPage, string | undefined>

// ═══════════════════════════════════════════════════════════════════════════
//   The letters are what the workspace keeps in browser storage between
//   visits. Bump the version whenever the shape of a cached application,
//   page or stats object changes.
// ═══════════════════════════════════════════════════════════════════════════
export const PERSISTED_APPLICATIONS: PersistedQueries = {
	roots: applicationKeys.all,
	version: 'applications-v3',
}

// ═══════════════════════════════════════════════════════════════════════════
//   Writes to the query cache that make a change visible before the server
//   round trip that confirms it. Each caller still invalidates afterwards,
//   so the cache converges on what the server actually holds.
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
//   A letter that was not in the list: a new one, or one brought back by
//   Undo. The list is ordered by id, newest first — ids are UUIDv7, so
//   their text order is their creation order — and the letter goes to its
//   own place, not to the top: an undone delete returns where it was. A
//   search's list only takes it if it matches that search.
//
//   Any copy already there is dropped first, so a refetch that raced the
//   insert can never show the same card twice. A letter older than every
//   loaded one, while more pages exist, is left for the next page to bring.
// ═══════════════════════════════════════════════════════════════════════════
export function insertApplication(
	queryClient: QueryClient,
	application: ApplicationDto,
): void {
	queryClient.setQueryData(applicationKeys.detail(application.id), application)
	updateLists(queryClient, (pages, search) =>
		matchesSearch(application.input, search)
			? insertInOrder(pages, application)
			: pages,
	)
	adjustTotal(queryClient, 1)
}

function insertInOrder(
	pages: ApplicationPage[],
	application: ApplicationDto,
): ApplicationPage[] {
	const next = pages.map((page) => ({
		...page,
		items: page.items.filter((item) => item.id !== application.id),
	}))

	for (const page of next) {
		const index = page.items.findIndex((item) => item.id < application.id)

		if (index !== -1) {
			page.items.splice(index, 0, application)
			return next
		}
	}

	const last = next.at(-1)

	if (last && last.nextCursor === null) last.items.push(application)

	return next
}

export function replaceApplication(
	queryClient: QueryClient,
	application: ApplicationDto,
): void {
	queryClient.setQueryData(applicationKeys.detail(application.id), application)
	updateLists(queryClient, (pages, search) =>
		mapItems(pages, (items) =>
			items.flatMap((item) => {
				if (item.id !== application.id) return [item]
				return matchesSearch(application.input, search) ? [application] : []
			}),
		),
	)
}

export function removeApplication(queryClient: QueryClient, id: string): void {
	updateLists(queryClient, (pages) =>
		mapItems(pages, (items) => items.filter((item) => item.id !== id)),
	)
	queryClient.removeQueries({ queryKey: applicationKeys.detail(id) })
	adjustTotal(queryClient, -1)
}

// ═══════════════════════════════════════════════════════════════════════════
//   Every cached list — the full one and one per search — with the search
//   it was fetched for, which is the last part of its key.
// ═══════════════════════════════════════════════════════════════════════════
function updateLists(
	queryClient: QueryClient,
	update: (pages: ApplicationPage[], search: string) => ApplicationPage[],
): void {
	const lists = queryClient.getQueriesData<ApplicationList>({
		queryKey: applicationKeys.lists(),
	})

	for (const [queryKey, list] of lists) {
		if (!list) continue

		const search = String(queryKey[2] ?? '')

		queryClient.setQueryData<ApplicationList>(queryKey, {
			...list,
			pages: update(list.pages, search),
		})
	}
}

function mapItems(
	pages: ApplicationPage[],
	update: (items: ApplicationDto[]) => ApplicationDto[],
): ApplicationPage[] {
	return pages.map((page) => ({ ...page, items: update(page.items) }))
}

function adjustTotal(queryClient: QueryClient, delta: number): void {
	queryClient.setQueryData<ApplicationStats>(
		applicationKeys.stats(),
		(stats) =>
			stats ? { ...stats, total: Math.max(0, stats.total + delta) } : stats,
	)
}

// ═══════════════════════════════════════════════════════════════════════════
//   A letter opened from the list starts from the list's copy, stamped with
//   the time the LIST was fetched — not "now" — so a copy that is already
//   stale (restored from storage, say) is revalidated on open instead of
//   passing for fresh for another thirty seconds.
// ═══════════════════════════════════════════════════════════════════════════
export function applicationFromList(
	queryClient: QueryClient,
	id: string,
): { data: ApplicationDto; updatedAt: number | undefined } | undefined {
	const lists = queryClient.getQueriesData<ApplicationList>({
		queryKey: applicationKeys.lists(),
	})

	for (const [queryKey, list] of lists) {
		const data = list?.pages
			.flatMap((page) => page.items)
			.find((item) => item.id === id)

		if (data) {
			return {
				data,
				updatedAt: queryClient.getQueryState(queryKey)?.dataUpdatedAt,
			}
		}
	}

	return undefined
}
