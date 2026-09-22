import { useInfiniteQuery } from '@tanstack/react-query'
import { useDeferredValue } from 'react'
import { applicationQueries } from '@/client/features/applications/api/application.queries'
import type { ApplicationPage } from '@/domain/applications/application-list'

// ═══════════════════════════════════════════════════════════════════════════
//   The letters for one search, paged in on demand. `items`,
//   `isLoadingMore` and `appendedFrom` are deferred together: the cache
//   updates through useSyncExternalStore, which renders synchronously and
//   never animates, and one deferred render lets <ViewTransition> animate
//   the change — with the skeleton row leaving in the very commit that
//   brings the cards replacing it.
// ═══════════════════════════════════════════════════════════════════════════
export function useApplicationList(search: string) {
	const query = useInfiniteQuery(applicationQueries.list(search))
	const items = useDeferredValue(query.data?.pages.flatMap((page) => page.items))
	const isLoadingMore = useDeferredValue(query.isFetchingNextPage)
	const appendedFrom = useDeferredValue(appendedPageStart(query.data?.pages))

	// ═════════════════════════════════════════════════════════════════════════
	//   Guarded here, not by the button: its loading state is deferred, so a
	//   second click can land before it shows, and a second fetchNextPage
	//   would cancel the first and request the same page twice.
	// ═════════════════════════════════════════════════════════════════════════
	const loadMore = () => {
		if (query.hasNextPage && !query.isFetchingNextPage) {
			query.fetchNextPage()
		}
	}

	return {
		appendedFrom,
		error: query.error,
		failedToLoad: query.isError && !query.data,
		failedToLoadMore: query.isFetchNextPageError,
		hasLoadedEverything: !query.hasNextPage && (query.data?.pages.length ?? 0) > 1,
		hasMore: query.hasNextPage && !query.isPlaceholderData,
		isEmpty: items?.length === 0 && !query.hasNextPage && !query.isPlaceholderData,
		isLoadingMore,
		isStale: query.isPlaceholderData,
		items,
		loadMore,
		retry: () => query.refetch(),
	}
}

// ═══════════════════════════════════════════════════════════════════════════
//   Where the latest loaded page begins in the flat list, so only its
//   cards get the arrival animation. The first page is not an arrival:
//   it replaces the skeletons through the view transition, and a search
//   change would otherwise replay the animation on every keystroke.
// ═══════════════════════════════════════════════════════════════════════════
function appendedPageStart(pages: readonly ApplicationPage[] | undefined): number | undefined {
	if (!pages || pages.length < 2) return undefined

	return pages.slice(0, -1).reduce((count, page) => count + page.items.length, 0)
}
