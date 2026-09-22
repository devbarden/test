import { BRAND_NAME } from '@/lib/document/brand'

export type LandingSection = { id: string; label: string }

export const LANDING_SECTIONS = {
	faq: { id: 'faq', label: 'FAQ' },
	features: { id: 'features', label: `Why ${BRAND_NAME}` },
	howItWorks: {
		id: 'how-it-works',
		label: 'How it works',
	},
} as const satisfies Record<string, LandingSection>

export const LANDING_NAV = [LANDING_SECTIONS.howItWorks, LANDING_SECTIONS.features, LANDING_SECTIONS.faq] as const
