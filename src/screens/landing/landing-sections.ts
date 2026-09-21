import { m } from '@/paraglide/messages'

// ═══════════════════════════════════════════════════════════════════════════
//   The page's anchors. Each section takes its id from here and the nav and
//   footer link to them in LANDING_NAV's order — the page's own order, which
//   an object's (sorted) keys cannot carry — so a renamed fragment cannot
//   leave a dead link behind.
// ═══════════════════════════════════════════════════════════════════════════
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
