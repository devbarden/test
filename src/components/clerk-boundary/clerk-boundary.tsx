import { ClerkProvider } from '@clerk/tanstack-react-start'
import type { ReactNode } from 'react'
import { clerkAppearance } from './clerk-appearance'

type ClerkBoundaryProps = {
	children: ReactNode
}

// ═══════════════════════════════════════════════════════════════════════════
//   Not at the document root: the landing must not load Clerk's script.
// ═══════════════════════════════════════════════════════════════════════════
export function ClerkBoundary({ children }: ClerkBoundaryProps) {
	return (
		<ClerkProvider
			afterSignOutUrl="/sign-in"
			appearance={clerkAppearance}
			signInUrl="/sign-in"
			signUpUrl="/sign-in"
		>
			{children}
		</ClerkProvider>
	)
}
