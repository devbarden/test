import { infiniteQueryOptions, keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { ApplicationPage } from '@/domain/applications/application-list'
import { getApplication, getApplicationStats, listApplications } from './application.api'

const FIRST_PAGE: string | undefined = undefined

export const applicationKeys = {
	all: ['applications'] as const,
	detail: (id: string) => [...applicationKeys.all, 'detail', id] as const,
	list: (search = '') => [...applicationKeys.lists(), search] as const,
	lists: () => [...applicationKeys.all, 'list'] as const,
	stats: () => [...applicationKeys.all, 'stats'] as const,
}

export const applicationQueries = {
	detail: (id: string) =>
		queryOptions({
			queryFn: () => getApplication({ data: { id } }),
			queryKey: applicationKeys.detail(id),
		}),

	list: (search = '') =>
		infiniteQueryOptions({
			getNextPageParam: (lastPage: ApplicationPage) => lastPage.nextCursor ?? undefined,
			initialPageParam: FIRST_PAGE,
			placeholderData: keepPreviousData,
			queryFn: ({ pageParam }) =>
				listApplications({
					data: { cursor: pageParam, search: search || undefined },
				}),
			queryKey: applicationKeys.list(search),
		}),

	stats: () =>
		queryOptions({
			queryFn: () => getApplicationStats(),
			queryKey: applicationKeys.stats(),
		}),
}
