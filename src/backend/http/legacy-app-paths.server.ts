// ═══════════════════════════════════════════════════════════════════════════
//   The workspace used to live at /applications, with billing inside it
//   (/applications/billing) and a new letter at /applications/new. It moved
//   under /app, with billing beside the letters. Bookmarks, the installed
//   PWA's old start URL and links pasted into chats still point at the old
//   shape, so every such address answers with a permanent redirect to its
//   new one, query string included, before routing or locale handling
//   ever sees it.
// ═══════════════════════════════════════════════════════════════════════════
const LEGACY_PREFIX = /^\/applications(?=\/|$)/

const RENAMED: Record<string, string> = {
	'': '/app/applications',
	'/billing': '/app/billing',
	'/new': '/app/applications/create',
}

export function legacyAppPath(pathname: string): string | undefined {
	if (!LEGACY_PREFIX.test(pathname)) return undefined

	const rest = pathname.replace(LEGACY_PREFIX, '').replace(/\/+$/, '')

	return RENAMED[rest] ?? `/app/applications${rest}`
}

export function legacyAppRedirect(request: Request): Response | undefined {
	const url = new URL(request.url)
	const pathname = legacyAppPath(url.pathname)

	if (!pathname) return undefined

	return new Response(null, {
		headers: { Location: `${pathname}${url.search}` },
		status: 301,
	})
}
