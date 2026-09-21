import { ClerkProvider } from '@clerk/tanstack-react-start'
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { clerkAppearance } from '@/lib/clerk-appearance'
import globalCss from '@/styles/global.css?url'

const FONTS_TO_PRELOAD = [
	'/fonts/FixelText-Regular.woff2',
	'/fonts/FixelText-Medium.woff2',
	'/fonts/FixelDisplay-SemiBold.woff2',
]

export const Route = createRootRoute({
	component: Outlet,
	head: () => ({
		links: [
			...FONTS_TO_PRELOAD.map((href) => ({
				as: 'font',
				crossOrigin: 'anonymous' as const,
				href,
				rel: 'preload',
				type: 'font/woff2',
			})),
			{ href: globalCss, rel: 'stylesheet' },
			{ href: '/favicon.svg', rel: 'icon', type: 'image/svg+xml' },
		],
		meta: [
			{ charSet: 'utf-8' },
			{ content: 'width=device-width, initial-scale=1', name: 'viewport' },
			{ title: 'Alt+Shift — Cover letters' },
			{
				content:
					'Generate a personalised cover letter for every job you apply to.',
				name: 'description',
			},
			{ content: '#ffffff', name: 'theme-color' },
		],
	}),
	shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) {
	return (
		<ClerkProvider afterSignOutUrl="/sign-in" appearance={clerkAppearance}>
			<html lang="en">
				<head>
					<HeadContent />
				</head>
				<body>
					{children}
					<Scripts />
				</body>
			</html>
		</ClerkProvider>
	)
}
