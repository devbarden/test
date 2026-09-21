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
//   Keyed by locale so a language switch drops text the React Compiler
//   memoized in the old language.
// ═══════════════════════════════════════════════════════════════════════════
function LocalizedOutlet() {
	const locale = useLocale()

	return (
		<Fragment key={locale}>
			<Outlet />
		</Fragment>
	)
}
