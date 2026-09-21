import { isIndexable, SITE_URL } from '@/lib/site'

const CANONICAL_HOST = new URL(SITE_URL).host

// ═══════════════════════════════════════════════════════════════════════════
//   One build serves the domain and every preview URL; only the Host header
//   tells them apart.
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
