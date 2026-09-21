export const BRAND_NAME = 'Alt+Shift'

// ═══════════════════════════════════════════════════════════════════════════
//   The public origin every absolute URL is built from: canonical links,
//   hreflang, Open Graph, the sitemap, robots.txt and llms.txt. Scrapers
//   read raw HTML and never resolve a relative og:image, so these must be
//   absolute — and absolute means knowing the domain.
//
//   Inlined at build time. Unset, the site cannot know its own address, so
//   it also refuses to be indexed (see `isIndexable`): a preview build or a
//   local run must never be the copy a search engine learns first.
// ═══════════════════════════════════════════════════════════════════════════
const configuredSiteUrl = import.meta.env.VITE_SITE_URL?.replace(/\/+$/, '')

export const SITE_URL = configuredSiteUrl || 'http://localhost:3000'

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`

export function isIndexable(): boolean {
	return import.meta.env.PROD && Boolean(configuredSiteUrl)
}

export function pageTitle(title: string): string {
	return `${title} · ${BRAND_NAME}`
}
