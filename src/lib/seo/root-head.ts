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

// ═══════════════════════════════════════════════════════════════════════════
//   The document-wide defaults. Every public page overrides title,
//   description and the card per meta name; what survives here is what a
//   route with no `head()` of its own inherits — the app and sign-in, never
//   shared on purpose but all of them pasteable into a chat window.
//
//   The robots tag says "index" only for a production build that knows its
//   own address (see `isIndexable`); a host that is not that address is
//   still told noindex by the X-Robots-Tag header, which a search engine
//   honours over this tag.
// ═══════════════════════════════════════════════════════════════════════════
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
