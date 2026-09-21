import { ClerkProvider } from '@clerk/tanstack-react-start'
import type { ReactNode } from 'react'
import { clerkAppearance } from '@/lib/clerk/clerk-appearance'
import { getClerkLocalization } from '@/lib/clerk/clerk-localization'
import { useLocale } from '@/lib/i18n/use-locale'

// ═══════════════════════════════════════════════════════════════════════════
//   Not at the document root: the landing must not load Clerk's script.
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
