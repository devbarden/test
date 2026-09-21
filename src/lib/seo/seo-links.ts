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
//   The router's own localizeUrl, so canonical, hreflang and links never
//   disagree on `/ru` vs `/ru/`.
// ═══════════════════════════════════════════════════════════════════════════
export function localizedUrl(path: string, locale: Locale): string {
	return localizeUrl(`${SITE_URL}${path}`, { locale }).href
}

export function currentUrl(path: string): string {
	return localizedUrl(path, getLocaleSnapshot())
}

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
//   `<` is escaped: a "</script>" inside the JSON would end the tag early.
// ═══════════════════════════════════════════════════════════════════════════
export function jsonLdScripts(schemas: readonly object[]) {
	return schemas.map((schema) => ({
		children: JSON.stringify(schema).replaceAll('<', '\\u003c'),
		type: 'application/ld+json',
	}))
}
