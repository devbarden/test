import { createRouter } from '@tanstack/react-router'
import { NotFound, RouteError } from '@/components/fallbacks'
import { notifyLocaleChange } from '@/lib/i18n/locale'
import { localeRewrite } from '@/lib/i18n/locale-rewrite'
import { pageTransitionTypes } from '@/lib/page-transition'
import { routeTree } from './routeTree.gen'

export function getRouter() {
	const router = createRouter({
		defaultErrorComponent: RouteError,
		defaultNotFoundComponent: NotFound,
		defaultPreload: 'intent',
		defaultViewTransition: { types: pageTransitionTypes },
		rewrite: localeRewrite,
		routeTree,
		scrollRestoration: ({ location }) => !location.state.keepScroll,
	})

	if (typeof window !== 'undefined') {
		router.subscribe('onResolved', notifyLocaleChange)
	}

	return router
}

declare module '@tanstack/react-router' {
	interface Register {
		router: ReturnType<typeof getRouter>
	}

	interface HistoryState {
		keepScroll?: boolean
		letterJustSaved?: boolean
	}
}
