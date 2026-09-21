import { useSyncExternalStore } from 'react'
import { getLocaleSnapshot, type Locale, subscribeToLocale } from './locale'

// ═══════════════════════════════════════════════════════════════════════════
//   Both snapshots are the same resolver on purpose — see
//   `getLocaleSnapshot` for why the locale must never be cached. Passing the
//   constant base locale as the server snapshot instead is the classic
//   version of this bug: every locale-aware widget renders English inside a
//   `/ru` page and corrects itself only after hydration, a visible flash on
//   the one paint the visitor is actually looking at.
// ═══════════════════════════════════════════════════════════════════════════
export function useLocale(): Locale {
	return useSyncExternalStore(
		subscribeToLocale,
		getLocaleSnapshot,
		getLocaleSnapshot,
	)
}
