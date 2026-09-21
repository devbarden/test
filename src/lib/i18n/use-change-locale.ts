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
