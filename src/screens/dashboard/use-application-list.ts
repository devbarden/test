import { useInfiniteQuery } from '@tanstack/react-query'
import { useDeferredValue } from 'react'
import { applicationQueries } from '@/features/applications/api/application.queries'
import { useOnVisible } from '@/hooks/use-on-visible'

const LOAD_AHEAD_MARGIN = '0px 0px 480px 0px'

// ═══════════════════════════════════════════════════════════════════════════
//   The letters for one search, paged in as the list scrolls. `items` and
//   `isLoadingMore` are deferred together: the cache updates through
//   useSyncExternalStore, which renders synchronously and never animates,
//   and one deferred render lets <ViewTransition> animate the change —
//   with the skeleton row leaving in the very commit that brings the cards
//   replacing it.
// ═══════════════════════════════════════════════════════════════════════════
export function useApplicationList(search: string) {
	const query = useInfiniteQuery(applicationQueries.list(search))
	const items = useDeferredValue(query.data?.pages.flatMap((page) => page.items))
	const isLoadingMore = useDeferredValue(query.isFetchingNextPage)
	const canLoadMore = query.hasNextPage && !query.isFetchingNextPage && !query.isFetchNextPageError
	// ═════════════════════════════════════════════════════════════════════════
	//   Re-checked at the moment the sentinel is seen: the observer can fire
	//   again before React has unmounted it, and a second fetchNextPage
	//   would cancel the first and request the same page twice.
	// ═════════════════════════════════════════════════════════════════════════
	const observeSentinel = useOnVisible(() => {
		if (query.hasNextPage && !query.isFetchingNextPage) {
			query.fetchNextPage()
		}
	}, LOAD_AHEAD_MARGIN)

	return {
		canLoadMore,
		error: query.error,
		failedToLoad: query.isError && !query.data,
		failedToLoadMore: query.isFetchNextPageError,
		hasLoadedEverything: !query.hasNextPage && (query.data?.pages.length ?? 0) > 1,
		isEmpty: items?.length === 0 && !query.hasNextPage && !query.isPlaceholderData,
		isLoadingMore,
		isStale: query.isPlaceholderData,
		items,
		loadMore: () => query.fetchNextPage(),
		observeSentinel,
		retry: () => query.refetch(),
	}
}
