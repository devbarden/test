import { useRouter } from '@tanstack/react-router'
import { flushSync } from 'react-dom'
import { localizeUrl } from '@/paraglide/runtime'
import {
	getLocale,
	type Locale,
	notifyLocaleChange,
	storeLocale,
} from './locale'
import { isLocalizablePath } from './localized-routes'

// ═══════════════════════════════════════════════════════════════════════════
//   Switches the language in place, without reloading the document. A
//   public page first moves to its translation's URL, where its locale
//   lives. The router sees `/ru/` and `/` as one route, so the new URL is
//   pushed onto the history directly — a navigation would find nothing to
//   do — and marked to keep the scroll position. The app keeps its URL: its
//   locale lives in the cookie.
//
//   Then every listener hears of the change and the page below the root
//   remounts under a new key (see routes/__root.tsx) — a remount, not a
//   re-render, because the React Compiler memoizes each component's copy
//   and would keep the old sentences. The query cache lives outside React,
//   so nothing is fetched again; the router is invalidated so every head()
//   writes its title and description in the new language. The swap is one
//   cross-fade where the browser can animate it.
// ═══════════════════════════════════════════════════════════════════════════
export function useChangeLocale(): (locale: Locale) => Promise<void> {
	const router = useRouter()

	return async (locale) => {
		if (locale === getLocale()) return

		storeLocale(locale)

		if (isLocalizablePath(router.state.location.pathname)) {
			const { hash, pathname, search } = localizeUrl(window.location.href, {
				locale,
			})

			router.history.push(`${pathname}${search}${hash}`, { keepScroll: true })
		}

		swapInPlace(() => flushSync(notifyLocaleChange))
		await router.invalidate()
	}
}

function swapInPlace(update: () => void): void {
	if (document.startViewTransition) document.startViewTransition(update)
	else update()
}
