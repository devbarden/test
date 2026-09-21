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

// ═══════════════════════════════════════════════════════════════════════════
//   Endonyms, never translated names. A language picker is read by someone
//   who does NOT yet read the current interface language — that is why they
//   are opening it — and "Русский" is findable inside an English page where
//   "Russian" translated into Russian is not. Keyed by `Locale`, so a locale
//   added to project.inlang fails the build until it has a name here.
// ═══════════════════════════════════════════════════════════════════════════
export const LOCALE_NAMES: Record<Locale, string> = {
	en: 'English',
	ru: 'Русский',
}

const OG_LOCALE: Record<Locale, string> = {
	en: 'en_US',
	ru: 'ru_RU',
}

// ═══════════════════════════════════════════════════════════════════════════
//   Spelled out per locale, never derived: `${l}_${L}` is right for ru and
//   wrong for en (en_EN does not exist), and the build fails here the day a
//   locale is added without its value.
// ═══════════════════════════════════════════════════════════════════════════
export function ogLocale(locale: Locale): string {
	return OG_LOCALE[locale]
}

const localeListeners = new Set<() => void>()

// ═══════════════════════════════════════════════════════════════════════════
//   Paraglide throws rather than guessing when it is asked for the locale
//   outside a request context — a module evaluated at import time, a test.
//   Every caller here wants a language to render in, not an incident, so the
//   throw becomes "I do not know" and the snapshot falls back to the base.
// ═══════════════════════════════════════════════════════════════════════════
export function getLocale(): Locale | undefined {
	try {
		return paraglideGetLocale()
	} catch {
		return undefined
	}
}

// ═══════════════════════════════════════════════════════════════════════════
//   Resolved on every read, and the same resolver serves the server and the
//   client snapshot. Memoizing it is a trap on both sides: on the server the
//   module is shared by every request, so a cached value would leak one
//   visitor's language into the next one's HTML; in the browser the locale
//   depends on the URL as much as on the cookie — the landing reads the
//   `/ru` prefix while the app reads the cookie — so a cache goes stale
//   exactly when a navigation crosses between those two zones.
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

// ═══════════════════════════════════════════════════════════════════════════
//   Records the choice without reloading: Paraglide writes the cookie the
//   app and the server read. On a public page the URL still names the old
//   locale until the caller navigates to the prefixed one.
// ═══════════════════════════════════════════════════════════════════════════
export function storeLocale(locale: Locale): void {
	paraglideSetLocale(locale, { reload: false })
}

export function notifyLocaleChange(): void {
	for (const listener of localeListeners) listener()
}
