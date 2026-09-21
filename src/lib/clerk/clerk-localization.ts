import { enUS, ruRU } from '@clerk/localizations'
import type { ClerkProvider } from '@clerk/tanstack-react-start'
import type { ComponentProps } from 'react'
import type { Locale } from '@/lib/i18n/locale'
import { CLERK_BILLING_RU } from './clerk-billing-ru'

type Localization = ComponentProps<typeof ClerkProvider>['localization']

type Dictionary = { [key: string]: Dictionary | string | undefined }

function withFallback(own: Dictionary, fallback: Dictionary): Dictionary {
	const merged: Dictionary = { ...fallback }

	for (const [key, value] of Object.entries(own)) {
		const base = merged[key]

		merged[key] =
			typeof value === 'object' && typeof base === 'object'
				? withFallback(value, base)
				: (value ?? base)
	}

	return merged
}

const CLERK_LOCALIZATIONS: Record<Locale, Localization> = {
	en: enUS,
	ru: {
		...ruRU,
		billing: withFallback(
			ruRU.billing as Dictionary,
			CLERK_BILLING_RU,
		) as typeof ruRU.billing,
	},
}

// ═══════════════════════════════════════════════════════════════════════════
//   Takes the locale as an argument: the React Compiler would treat a
//   reader with no argument as a constant and keep the first language.
// ═══════════════════════════════════════════════════════════════════════════
export function getClerkLocalization(locale: Locale): Localization {
	return CLERK_LOCALIZATIONS[locale]
}
