import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import type { ApplicationPage } from '../model/application.schema'
import {
	getApplication,
	getApplicationStats,
	listApplications,
} from './application.api'

export const applicationKeys = {
	all: ['applications'] as const,
	detail: (id: string) => [...applicationKeys.all, 'detail', id] as const,
	list: () => [...applicationKeys.all, 'list'] as const,
	stats: () => [...applicationKeys.all, 'stats'] as const,
}

export const applicationQueries = {
	detail: (id: string) =>
		queryOptions({
			queryFn: () => getApplication({ data: { id } }),
			queryKey: applicationKeys.detail(id),
		}),

	list: () =>
		infiniteQueryOptions({
			getNextPageParam: (lastPage: ApplicationPage) =>
				lastPage.nextCursor ?? undefined,
			initialPageParam: undefined as string | undefined,
			queryFn: ({ pageParam }) =>
				listApplications({ data: { cursor: pageParam } }),
			queryKey: applicationKeys.list(),
		}),

	stats: () =>
		queryOptions({
			queryFn: () => getApplicationStats(),
			queryKey: applicationKeys.stats(),
		}),
}
