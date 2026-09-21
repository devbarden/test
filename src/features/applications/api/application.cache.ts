import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type {
	ApplicationDto,
	ApplicationPage,
	ApplicationStats,
} from '@/domain/applications/application.schema'
import { matchesSearch } from '@/domain/applications/application-search'
import type { PersistedQueries } from '@/lib/query/user-query-client'
import { applicationKeys } from './application.queries'

type ApplicationList = InfiniteData<ApplicationPage, string | undefined>

export const PERSISTED_APPLICATIONS: PersistedQueries = {
	roots: applicationKeys.all,
	version: 'applications-v3',
}

// ═══════════════════════════════════════════════════════════════════════════
//   Placed by id, not on top, so Undo restores it in place; an existing
//   copy is dropped first so a racing refetch cannot show it twice.
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

function cachedLists(queryClient: QueryClient) {
	return queryClient.getQueriesData<ApplicationList>({
		queryKey: applicationKeys.lists(),
	})
}

function updateLists(
	queryClient: QueryClient,
	update: (pages: ApplicationPage[], search: string) => ApplicationPage[],
): void {
	for (const [queryKey, list] of cachedLists(queryClient)) {
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
//   Stamped with the list's fetch time, not now, so a stale copy
//   revalidates on open.
// ═══════════════════════════════════════════════════════════════════════════
export function applicationFromList(
	queryClient: QueryClient,
	id: string,
): { data: ApplicationDto; updatedAt: number | undefined } | undefined {
	for (const [queryKey, list] of cachedLists(queryClient)) {
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
