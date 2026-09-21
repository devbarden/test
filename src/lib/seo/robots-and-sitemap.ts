import { baseLocale, locales } from '@/lib/i18n/locale'
import { SITE_URL } from '@/lib/site'
import { localizedUrl } from './seo-links'

const LOCALIZED_PATHS = [{ changefreq: 'weekly', path: '/', priority: '1.0' }]

const ALTERNATE_PRIORITY = '0.8'

// ═══════════════════════════════════════════════════════════════════════════
//   Robots rules are prefixes: a bare `/app` would also block `/apply`.
//   Sign-in is not disallowed, so crawlers can read its noindex.
// ═══════════════════════════════════════════════════════════════════════════
const DISALLOWED = ['/app$', '/app?', '/app/', '/api/', '/_serverFn/']

// ═══════════════════════════════════════════════════════════════════════════
//   RFC 9309: a crawler matching a named group ignores `*`, so the AI group
//   repeats every Disallow.
// ═══════════════════════════════════════════════════════════════════════════
const AI_CRAWLERS = [
	'GPTBot',
	'ChatGPT-User',
	'OAI-SearchBot',
	'ClaudeBot',
	'Claude-User',
	'Claude-SearchBot',
	'PerplexityBot',
	'Perplexity-User',
	'Google-Extended',
	'Applebot-Extended',
	'Meta-ExternalAgent',
	'Amazonbot',
	'MistralAI-User',
	'YandexAdditional',
	'CCBot',
]

function buildRobotsTxt(): string {
	const disallow = DISALLOWED.map((path) => `Disallow: ${path}`)

	return [
		`# robots.txt — ${SITE_URL}`,
		'',
		'User-agent: *',
		'Allow: /',
		...disallow,
		'',
		'# AI crawlers. /llms.txt is the curated summary; /llms-full.txt is the',
		'# whole public site in one markdown document, in every language.',
		...AI_CRAWLERS.map((agent) => `User-agent: ${agent}`),
		'Allow: /',
		...disallow,
		'',
		`Sitemap: ${SITE_URL}/sitemap.xml`,
		'',
	].join('\n')
}

function hreflangAlternates(path: string): string {
	return [
		...locales.map(
			(locale) =>
				`\t\t<xhtml:link href="${localizedUrl(path, locale)}" hreflang="${locale}" rel="alternate"/>`,
		),
		`\t\t<xhtml:link href="${localizedUrl(path, baseLocale)}" hreflang="x-default" rel="alternate"/>`,
	].join('\n')
}

function buildSitemap(): string {
	const urls = LOCALIZED_PATHS.flatMap(({ changefreq, path, priority }) =>
		locales.map(
			(locale) => `\t<url>
\t\t<loc>${localizedUrl(path, locale)}</loc>
\t\t<changefreq>${changefreq}</changefreq>
\t\t<priority>${locale === baseLocale ? priority : ALTERNATE_PRIORITY}</priority>
${hreflangAlternates(path)}
\t</url>`,
		),
	)

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
\txmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
\txmlns:xhtml="http://www.w3.org/1999/xhtml"
>
${urls.join('\n')}
</urlset>
`
}

let cachedRobotsTxt: string | undefined
let cachedSitemap: string | undefined

export function generateRobotsTxt(): string {
	cachedRobotsTxt ??= buildRobotsTxt()
	return cachedRobotsTxt
}

export function generateSitemap(): string {
	cachedSitemap ??= buildSitemap()
	return cachedSitemap
}
