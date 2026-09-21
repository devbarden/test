import { ClerkProvider } from '@clerk/tanstack-react-start'
import type { ReactNode } from 'react'
import { clerkAppearance } from '@/lib/clerk/clerk-appearance'
import { getClerkLocalization } from '@/lib/clerk/clerk-localization'
import { useLocale } from '@/lib/i18n/use-locale'

// ═══════════════════════════════════════════════════════════════════════════
//   Every mount of ClerkProvider goes through here, so the two places that
//   need auth — the workspace and the sign-in screen — cannot drift in theme
//   or in language. It is deliberately NOT at the document root: the landing
//   has no business loading a third-party auth script, and it is the page a
//   first-time visitor — and a crawler measuring speed — sees.
//
//   Sign-in and sign-up are one page: both URLs point at it, and its single
//   <SignIn withSignUp> switches between the two flows itself.
// ═══════════════════════════════════════════════════════════════════════════
export function ClerkBoundary({ children }: { children: ReactNode }) {
	const locale = useLocale()

	return (
		<ClerkProvider
			afterSignOutUrl="/sign-in"
			appearance={clerkAppearance}
			localization={getClerkLocalization(locale)}
			signInUrl="/sign-in"
			signUpUrl="/sign-in"
		>
			{children}
		</ClerkProvider>
	)
}
