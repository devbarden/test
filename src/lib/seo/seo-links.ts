import {
	baseLocale,
	getLocaleSnapshot,
	type Locale,
	locales,
	ogLocale,
} from '@/lib/i18n/locale'
import { DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/site'
import { localizeUrl } from '@/paraglide/runtime'

// ═══════════════════════════════════════════════════════════════════════════
//   Built with Paraglide's `localizeUrl`, the same function the router's
//   output rewrite runs, so the canonical, the hreflang cluster, the sitemap
//   and every <a> on the page spell a URL identically. A hand-built prefix
//   drifts: it writes `/ru` where the links say `/ru/`, and a search engine
//   then sees two URLs for one page and a canonical naming the one nothing
//   links to.
// ═══════════════════════════════════════════════════════════════════════════
export function localizedUrl(path: string, locale: Locale): string {
	return localizeUrl(`${SITE_URL}${path}`, { locale }).href
}

export function currentUrl(path: string): string {
	return localizedUrl(path, getLocaleSnapshot())
}

// ═══════════════════════════════════════════════════════════════════════════
//   The cluster is per PAGE and reciprocal — every translation lists every
//   other and itself, plus x-default for a visitor whose language is none of
//   them — and the sitemap repeats it exactly (see robots-and-sitemap.ts).
// ═══════════════════════════════════════════════════════════════════════════
export function alternateLinks(path: string) {
	return [
		...locales.map((locale) => ({
			href: localizedUrl(path, locale),
			hrefLang: locale,
			rel: 'alternate',
		})),
		{
			href: localizedUrl(path, baseLocale),
			hrefLang: 'x-default',
			rel: 'alternate',
		},
	]
}

export function socialMeta(title: string, description: string, url: string) {
	return [
		{ content: description, name: 'description' },
		{ content: title, property: 'og:title' },
		{ content: description, property: 'og:description' },
		{ content: 'website', property: 'og:type' },
		{ content: url, property: 'og:url' },
		{ content: ogLocale(getLocaleSnapshot()), property: 'og:locale' },
		{ content: DEFAULT_OG_IMAGE, property: 'og:image' },
		{ content: '1200', property: 'og:image:width' },
		{ content: '630', property: 'og:image:height' },
		{ content: title, property: 'og:image:alt' },
		{ content: 'summary_large_image', name: 'twitter:card' },
		{ content: title, name: 'twitter:title' },
		{ content: description, name: 'twitter:description' },
		{ content: DEFAULT_OG_IMAGE, name: 'twitter:image' },
	]
}

// ═══════════════════════════════════════════════════════════════════════════
//   `<` is escaped because the JSON lands inside a <script> element: a
//   string containing "</script>" would otherwise end it early.
// ═══════════════════════════════════════════════════════════════════════════
export function jsonLdScripts(schemas: readonly object[]) {
	return schemas.map((schema) => ({
		children: JSON.stringify(schema).replaceAll('<', '\\u003c'),
		type: 'application/ld+json',
	}))
}
