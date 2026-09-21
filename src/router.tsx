import { createRouter } from '@tanstack/react-router'
import { NotFound, RouteError } from '@/components/fallbacks'
import { pageTransitionTypes } from '@/lib/document/page-transition'
import { routeTree } from './routeTree.gen'

export function getRouter() {
	return createRouter({
		defaultErrorComponent: RouteError,
		defaultNotFoundComponent: NotFound,
		defaultPreload: 'intent',
		defaultViewTransition: { types: pageTransitionTypes },
		routeTree,
		scrollRestoration: true,
	})
}

declare module '@tanstack/react-router' {
	interface Register {
		router: ReturnType<typeof getRouter>
	}

	interface HistoryState {
		letterJustSaved?: boolean
	}
}
