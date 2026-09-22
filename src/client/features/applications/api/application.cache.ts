import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type { PersistedQueries } from '@/client/lib/query/user-query-client'
import type { ApplicationDto } from '@/domain/applications/application.schema'
import type { ApplicationPage } from '@/domain/applications/application-list'
import { matchesSearch } from '@/domain/applications/application-search'
import type { ApplicationStats } from '@/domain/applications/application-stats'
import { applicationKeys } from './application.queries'

type ApplicationList = InfiniteData<ApplicationPage, string | undefined>

// ═══════════════════════════════════════════════════════════════════════════
//   Only what reopening the tab needs: the unfiltered list and the counts.
//   Searches and opened letters would grow the snapshot without bound.
// ═══════════════════════════════════════════════════════════════════════════
export const PERSISTED_APPLICATIONS: PersistedQueries = {
	keys: [applicationKeys.list(), applicationKeys.stats()],
	version: 'applications-v4',
}

export function refreshApplications(queryClient: QueryClient): Promise<void> {
	return queryClient.invalidateQueries({ queryKey: applicationKeys.all })
}

export function insertApplication(queryClient: QueryClient, application: ApplicationDto): void {
	queryClient.setQueryData(applicationKeys.detail(application.id), application)
	editLists(queryClient, (pages, search) =>
		matchesSearch(application, search) ? insertInOrder(pages, application) : pages,
	)
	adjustTotal(queryClient, 1)
}

export function replaceApplication(queryClient: QueryClient, application: ApplicationDto): void {
	queryClient.setQueryData(applicationKeys.detail(application.id), application)
	editLists(queryClient, (pages, search) =>
		matchesSearch(application, search)
			? editItems(pages, (items) => items.map((item) => (item.id === application.id ? application : item)))
			: withoutApplication(pages, application.id),
	)
}

export function removeApplication(queryClient: QueryClient, id: string): void {
	editLists(queryClient, (pages) => withoutApplication(pages, id))
	queryClient.removeQueries({ queryKey: applicationKeys.detail(id) })
	adjustTotal(queryClient, -1)
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
		const data = list?.pages.flatMap((page) => page.items).find((item) => item.id === id)

		if (data) return { data, updatedAt: queryClient.getQueryState(queryKey)?.dataUpdatedAt }
	}

	return undefined
}

// ═══════════════════════════════════════════════════════════════════════════
//   Placed by id, newest first like the server, so Undo restores a card
//   where it was; past the loaded pages it waits for the next fetch. An
//   existing copy is dropped first so a racing refetch cannot show it twice.
// ═══════════════════════════════════════════════════════════════════════════
function insertInOrder(pages: ApplicationPage[], application: ApplicationDto): ApplicationPage[] {
	const next = withoutApplication(pages, application.id)

	for (const page of next) {
		const index = page.items.findIndex((item) => item.id < application.id)

		if (index !== -1) {
			page.items.splice(index, 0, application)
			return next
		}
	}

	const last = next.at(-1)

	if (last?.nextCursor === null) last.items.push(application)

	return next
}

function withoutApplication(pages: ApplicationPage[], id: string): ApplicationPage[] {
	return editItems(pages, (items) => items.filter((item) => item.id !== id))
}

function editItems(pages: ApplicationPage[], edit: (items: ApplicationDto[]) => ApplicationDto[]): ApplicationPage[] {
	return pages.map((page) => ({ ...page, items: edit(page.items) }))
}

function editLists(queryClient: QueryClient, edit: (pages: ApplicationPage[], search: string) => ApplicationPage[]) {
	for (const [queryKey, list] of cachedLists(queryClient)) {
		const [, , search] = queryKey

		if (list) {
			queryClient.setQueryData<ApplicationList>(queryKey, {
				...list,
				pages: edit(list.pages, typeof search === 'string' ? search : ''),
			})
		}
	}
}

function cachedLists(queryClient: QueryClient) {
	return queryClient.getQueriesData<ApplicationList>({ queryKey: applicationKeys.lists() })
}

function adjustTotal(queryClient: QueryClient, delta: number): void {
	queryClient.setQueryData<ApplicationStats>(applicationKeys.stats(), (stats) =>
		stats ? { ...stats, total: Math.max(0, stats.total + delta) } : stats,
	)
}
