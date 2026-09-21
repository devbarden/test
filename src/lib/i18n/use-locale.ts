import { useSyncExternalStore } from 'react'
import { getLocaleSnapshot, type Locale, subscribeToLocale } from './locale'

export function useLocale(): Locale {
	return useSyncExternalStore(
		subscribeToLocale,
		getLocaleSnapshot,
		getLocaleSnapshot,
	)
}
