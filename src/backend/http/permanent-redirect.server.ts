// ═══════════════════════════════════════════════════════════════════════════
//   A 307 to the canonical spelling becomes a 308, so crawlers drop the wrong
//   URL.
// ═══════════════════════════════════════════════════════════════════════════
export function asPermanentIfSpelling(
	request: Request,
	response: Response,
): Response {
	const location = response.headers.get('Location')

	if (response.status !== 307 || !location) return response

	const from = new URL(request.url)
	const to = new URL(location, from)
	const isSpelling =
		to.origin === from.origin &&
		normalizedPathname(to) === normalizedPathname(from)

	return isSpelling
		? new Response(null, { headers: response.headers, status: 308 })
		: response
}

function normalizedPathname(url: URL): string {
	return url.pathname.toLowerCase().replace(/\/+$/, '') || '/'
}
