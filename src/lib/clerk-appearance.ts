import type { ClerkProvider } from '@clerk/tanstack-react-start'
import type { ComponentProps } from 'react'

type Appearance = ComponentProps<typeof ClerkProvider>['appearance']

// ═══════════════════════════════════════════════════════════════════════════
//   Clerk renders its own UI, so it gets the product's tokens by value:
//   its variables API does not read CSS custom properties.
// ═══════════════════════════════════════════════════════════════════════════
export const clerkAppearance: Appearance = {
	variables: {
		borderRadius: '0.5rem',
		colorForeground: '#101828',
		colorMutedForeground: '#475467',
		colorPrimary: '#33704a',
		fontFamily: "'Fixel Text', ui-sans-serif, system-ui, sans-serif",
	},
}
