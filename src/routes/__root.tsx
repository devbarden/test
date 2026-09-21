import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { NotFound, RouteError } from '@/components/fallbacks'
import { StandalonePage } from '@/components/layout/standalone-page'
import { documentHead } from '@/lib/document/document-head'

export const Route = createRootRoute({
	component: Outlet,
	errorComponent: (props) => (
		<StandalonePage>
			<RouteError {...props} />
		</StandalonePage>
	),
	head: documentHead,
	notFoundComponent: () => (
		<StandalonePage>
			<NotFound />
		</StandalonePage>
	),
	shellComponent: RootDocument,
})

type RootDocumentProps = {
	children: ReactNode
}

function RootDocument({ children }: RootDocumentProps) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	)
}
