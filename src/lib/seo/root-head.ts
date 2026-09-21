import { BRAND_NAME, isIndexable, SITE_URL } from '@/lib/site'
import { m } from '@/paraglide/messages'
import stylesheet from '@/styles/index.css?url'
import { socialMeta } from './seo-links'

const FONTS_TO_PRELOAD = [
	'/fonts/FixelText-Regular.woff2',
	'/fonts/FixelText-Medium.woff2',
	'/fonts/FixelText-SemiBold.woff2',
	'/fonts/FixelDisplay-SemiBold.woff2',
]

export function rootHead() {
	const title = m['meta.root.title']()
	const description = m['meta.root.description']()

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
			{ title },
			{
				content: isIndexable()
					? 'index, follow, max-snippet:-1, max-image-preview:large'
					: 'noindex, nofollow',
				name: 'robots',
			},
			{ content: BRAND_NAME, property: 'og:site_name' },
			...socialMeta(title, description, SITE_URL),
			{ content: '#ffffff', name: 'theme-color' },
		],
	}
}
