import stylesheet from '@/client/styles/index.css?url'
import { BRAND_NAME } from './brand'

const FONTS_TO_PRELOAD = [
	'/fonts/FixelText-Regular.woff2',
	'/fonts/FixelText-Medium.woff2',
	'/fonts/FixelText-SemiBold.woff2',
	'/fonts/FixelDisplay-SemiBold.woff2',
]

export function documentHead() {
	return {
		links: [
			...FONTS_TO_PRELOAD.map((href) => ({
				as: 'font',
				crossOrigin: 'anonymous' as const,
				href,
				rel: 'preload',
				type: 'font/woff2',
			})),
			{ href: stylesheet, rel: 'stylesheet' },
			{ href: '/favicon.ico', rel: 'icon', sizes: 'any' },
			{ href: '/favicon.svg', rel: 'icon', type: 'image/svg+xml' },
			{ href: '/apple-touch-icon.png', rel: 'apple-touch-icon' },
			{ href: '/manifest.json', rel: 'manifest' },
		],
		meta: [
			{ charSet: 'utf-8' },
			{ content: 'width=device-width, initial-scale=1', name: 'viewport' },
			{ title: `${BRAND_NAME} — cover letters` },
			{ content: '#ffffff', name: 'theme-color' },
		],
	}
}
