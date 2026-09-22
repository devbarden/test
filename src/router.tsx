import { createRouter } from '@tanstack/react-router'
import { NotFound } from '@/client/components/not-found'
import { RouteError } from '@/client/components/route-error'
import { pageTransitionTypes } from '@/client/lib/document/page-transition'
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
