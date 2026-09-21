import { createRouter } from '@tanstack/react-router'
import { NotFound, RouteError } from '@/components/fallbacks'
import {
	isLocalizablePath,
	isUnlocalizedPath,
} from '@/lib/i18n/localized-routes'
import { pageTransitionTypes } from '@/lib/page-transition'
import { deLocalizeUrl, localizeUrl } from '@/paraglide/runtime'
import { routeTree } from './routeTree.gen'

// ═══════════════════════════════════════════════════════════════════════════
//   URL localization is asymmetric:
//
//   - Output: every public path is written with its locale prefix, so a
//     link on the Russian landing points at `/ru/…`. The app, sign-in and
//     the API keep their bare URLs.
//   - Input: a prefixed URL RESOLVES to the underlying route — the route
//     tree has no `/ru` twin of anything. Except inside the unlocalized
//     zone: `/ru/applications` must stay unresolved (a 404) rather than
//     become a second spelling of a page that exists once.
// ═══════════════════════════════════════════════════════════════════════════
function delocalizeInput(url: URL): URL {
	if (isUnlocalizedPath(url.pathname)) return url

	const delocalized = deLocalizeUrl(url)

	return isUnlocalizedPath(delocalized.pathname) ? url : delocalized
}

export function getRouter() {
	return createRouter({
		defaultErrorComponent: RouteError,
		defaultNotFoundComponent: NotFound,
		defaultPreload: 'intent',
		defaultViewTransition: { types: pageTransitionTypes },
		rewrite: {
			input: ({ url }) => delocalizeInput(url),
			output: ({ url }) =>
				isLocalizablePath(url.pathname) ? localizeUrl(url) : url,
		},
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
