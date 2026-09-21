import { createRouter } from '@tanstack/react-router'
import { NotFound, RouteError } from '@/components/fallbacks'
import { routeTree } from './routeTree.gen'

export function getRouter() {
	return createRouter({
		defaultErrorComponent: RouteError,
		defaultNotFoundComponent: NotFound,
		defaultPreload: 'intent',
		routeTree,
		scrollRestoration: true,
	})
}

declare module '@tanstack/react-router' {
	interface Register {
		router: ReturnType<typeof getRouter>
	}
}
