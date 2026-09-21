import { baseLocale, locales } from '@/lib/i18n/locale'
import { SITE_URL } from '@/lib/site'
import { localizedUrl } from './seo-links'

// ═══════════════════════════════════════════════════════════════════════════
//   The indexable pages, written out by hand and never derived from the
//   route tree: a new private route is then unindexed by default instead of
//   published the moment it is added. No <lastmod>: the landing has no real
//   edit date, and a build timestamp would mark it "modified today" on every
//   deploy — which is precisely how a crawler learns to ignore the field.
// ═══════════════════════════════════════════════════════════════════════════
const LOCALIZED_PATHS = [{ changefreq: 'weekly', path: '/', priority: '1.0' }]

const ALTERNATE_PRIORITY = '0.8'

// ═══════════════════════════════════════════════════════════════════════════
//   Robots rules are PREFIX matches, so `/app` is spelled as its three
//   exact shapes rather than a bare prefix that would also swallow any
//   future `/apply` or `/app-guide`. Sign-in is deliberately absent: it carries
//   noindex in its own head, and a disallow would stop a crawler from ever
//   reading that — leaving it "indexed, though blocked".
// ═══════════════════════════════════════════════════════════════════════════
const DISALLOWED = ['/app$', '/app?', '/app/', '/api/', '/_serverFn/']

// ═══════════════════════════════════════════════════════════════════════════
//   AI crawlers are welcome — being quoted by an assistant is how a tool
//   like this gets found now — and they get a group of their own that
//   repeats every Disallow. RFC 9309 is winner-takes-all: a crawler that
//   matches a named group ignores `*` entirely, so a group listing only
//   `Allow: /` would open the app to it.
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
