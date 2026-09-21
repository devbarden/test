import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import { applicationKeys } from './application.queries'
import type {
	ApplicationDto,
	ApplicationPage,
	ApplicationStats,
} from './application.schema'

type ApplicationList = InfiniteData<ApplicationPage, string | undefined>

// ═══════════════════════════════════════════════════════════════════════════
//   Writes to the query cache that make a change visible before the server
//   round trip that confirms it. Each caller still invalidates afterwards,
//   so the cache converges on what the server actually holds.
// ═══════════════════════════════════════════════════════════════════════════
export function putApplicationInCache(
	queryClient: QueryClient,
	application: ApplicationDto,
	{ isNew }: { isNew: boolean },
): void {
	queryClient.setQueryData(applicationKeys.detail(application.id), application)

	queryClient.setQueryData<ApplicationList>(applicationKeys.list(), (list) => {
		if (!list) return list

		if (!isNew) {
			return mapItems(list, (item) =>
				item.id === application.id ? application : item,
			)
		}

		const [first, ...rest] = list.pages

		return first
			? {
					...list,
					pages: [{ ...first, items: [application, ...first.items] }, ...rest],
				}
			: list
	})

	if (isNew) {
		queryClient.setQueryData<ApplicationStats>(
			applicationKeys.stats(),
			(stats) => (stats ? { ...stats, total: stats.total + 1 } : stats),
		)
	}
}

export function removeApplicationFromCache(
	queryClient: QueryClient,
	id: string,
): void {
	queryClient.setQueryData<ApplicationList>(applicationKeys.list(), (list) =>
		list
			? {
					...list,
					pages: list.pages.map((page) => ({
						...page,
						items: page.items.filter((item) => item.id !== id),
					})),
				}
			: list,
	)
	queryClient.removeQueries({ queryKey: applicationKeys.detail(id) })

	queryClient.setQueryData<ApplicationStats>(
		applicationKeys.stats(),
		(stats) =>
			stats ? { ...stats, total: Math.max(0, stats.total - 1) } : stats,
	)
}

export function findApplicationInList(
	queryClient: QueryClient,
	id: string,
): ApplicationDto | undefined {
	return queryClient
		.getQueryData<ApplicationList>(applicationKeys.list())
		?.pages.flatMap((page) => page.items)
		.find((item) => item.id === id)
}

function mapItems(
	list: ApplicationList,
	map: (item: ApplicationDto) => ApplicationDto,
): ApplicationList {
	return {
		...list,
		pages: list.pages.map((page) => ({ ...page, items: page.items.map(map) })),
	}
}
