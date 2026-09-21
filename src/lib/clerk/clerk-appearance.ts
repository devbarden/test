import type { ClerkProvider } from '@clerk/tanstack-react-start'
import type { ComponentProps } from 'react'

type ClerkProps = ComponentProps<typeof ClerkProvider>

type Appearance = ClerkProps['appearance']

// ═══════════════════════════════════════════════════════════════════════════
//   Clerk renders its own UI, so it gets the product's tokens by value:
//   its variables API does not read CSS custom properties.
// ═══════════════════════════════════════════════════════════════════════════
export const clerkAppearance: Appearance = {
	elements: {
		cardBox: { boxShadow: '0 32px 64px -32px rgb(8 76 46 / 0.55)' },
		formButtonPrimary: { fontWeight: 600 },
	},
	variables: {
		borderRadius: '0.375rem',
		colorBackground: '#ffffff',
		colorDanger: '#f04438',
		colorForeground: '#101828',
		colorInput: '#ffffff',
		colorMutedForeground: '#667085',
		colorPrimary: '#087443',
		colorSuccess: '#12b76a',
		fontFamily: "'Fixel Text', ui-sans-serif, system-ui, sans-serif",
		fontFamilyButtons: "'Fixel Text', ui-sans-serif, system-ui, sans-serif",
	},
}
