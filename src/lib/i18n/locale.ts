import {
	type Locale,
	baseLocale as paraglideBaseLocale,
	getLocale as paraglideGetLocale,
	locales as paraglideLocales,
	setLocale as paraglideSetLocale,
} from '@/paraglide/runtime'

export type { Locale }

export const baseLocale: Locale = paraglideBaseLocale

export const locales = paraglideLocales as readonly Locale[]

export const LOCALE_NAMES: Record<Locale, string> = {
	en: 'English',
	ru: 'Русский',
}

const OG_LOCALE: Record<Locale, string> = {
	en: 'en_US',
	ru: 'ru_RU',
}

export function ogLocale(locale: Locale): string {
	return OG_LOCALE[locale]
}

const localeListeners = new Set<() => void>()

// ═══════════════════════════════════════════════════════════════════════════
//   Paraglide throws outside a request context; callers want a fallback,
//   not an error.
// ═══════════════════════════════════════════════════════════════════════════
export function getLocale(): Locale | undefined {
	try {
		return paraglideGetLocale()
	} catch {
		return undefined
	}
}

// ═══════════════════════════════════════════════════════════════════════════
//   Never memoized: on the server the module is shared by every request,
//   and in the browser the locale depends on the URL as well as the cookie.
// ═══════════════════════════════════════════════════════════════════════════
export function getLocaleSnapshot(): Locale {
	return getLocale() ?? baseLocale
}

export function subscribeToLocale(listener: () => void): () => void {
	localeListeners.add(listener)

	return () => {
		localeListeners.delete(listener)
	}
}

export function storeLocale(locale: Locale): void {
	paraglideSetLocale(locale, { reload: false })
}

export function notifyLocaleChange(): void {
	for (const listener of localeListeners) listener()
}
