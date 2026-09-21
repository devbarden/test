import { isIndexable, SITE_URL } from '@/lib/site'

const CANONICAL_HOST = new URL(SITE_URL).host

// ═══════════════════════════════════════════════════════════════════════════
//   The header half of "what may be indexed"; the page's robots meta is the
//   other. One production build serves the real domain, any staging host
//   and every Railway preview URL alike, so nothing known at build time can
//   tell them apart — the Host header can. A search engine honours the
//   stricter of header and meta, so a non-canonical host is told noindex
//   here without the HTML changing.
//
//   Redirects never carry it (a crawler must follow a redirect to the
//   canonical page, not drop it), a 404 is noindex everywhere, and the API
//   and server functions are never a page.
// ═══════════════════════════════════════════════════════════════════════════
export function robotsHeader(
	request: Request,
	response: Response,
): string | undefined {
	const { pathname } = new URL(request.url)
	const isRedirect = response.status >= 300 && response.status < 400

	if (isRedirect) return undefined

	const isCanonicalHost =
		isIndexable() && request.headers.get('host') === CANONICAL_HOST

	if (!isCanonicalHost) return 'noindex, nofollow'
	if (pathname.startsWith('/api/') || pathname.startsWith('/_serverFn/')) {
		return 'noindex'
	}
	if (response.status === 404) return 'noindex'

	return undefined
}
