import { m } from '@/paraglide/messages'

export const LANDING_SECTIONS = {
	faq: { id: 'faq', label: () => m['landing.nav.faq']() },
	features: { id: 'features', label: () => m['landing.nav.features']() },
	howItWorks: {
		id: 'how-it-works',
		label: () => m['landing.nav.howItWorks'](),
	},
} as const

export const LANDING_NAV = [
	LANDING_SECTIONS.howItWorks,
	LANDING_SECTIONS.features,
	LANDING_SECTIONS.faq,
] as const
