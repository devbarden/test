import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from '@tanstack/react-router'
import { Fragment, type ReactNode } from 'react'
import { NotFound, RouteError } from '@/components/fallbacks'
import { StandalonePage } from '@/components/layout/standalone-page'
import { OgLocaleAlternates } from '@/components/seo/og-locale-alternates'
import { useLocale } from '@/lib/i18n/use-locale'
import { rootHead } from '@/lib/seo/root-head'

export const Route = createRootRoute({
	component: LocalizedOutlet,
	errorComponent: (props) => (
		<StandalonePage>
			<RouteError {...props} />
		</StandalonePage>
	),
	head: rootHead,
	notFoundComponent: () => (
		<StandalonePage>
			<NotFound />
		</StandalonePage>
	),
	shellComponent: RootDocument,
})

// ═══════════════════════════════════════════════════════════════════════════
//   `lang` comes from the same resolver as every message on the page, on
//   the server and in the browser alike, so the attribute a screen reader
//   picks its voice from always matches the language it is reading.
// ═══════════════════════════════════════════════════════════════════════════
function RootDocument({ children }: { children: ReactNode }) {
	const locale = useLocale()

	return (
		<html lang={locale}>
			<head>
				<HeadContent />
				<OgLocaleAlternates />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	)
}

// ═══════════════════════════════════════════════════════════════════════════
//   Keyed by locale: a language switch remounts every page below the root,
//   so no component keeps a sentence the React Compiler memoized in the
//   language being left (see lib/i18n/use-change-locale.ts).
// ═══════════════════════════════════════════════════════════════════════════
function LocalizedOutlet() {
	const locale = useLocale()

	return (
		<Fragment key={locale}>
			<Outlet />
		</Fragment>
	)
}
