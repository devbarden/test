// ═══════════════════════════════════════════════════════════════════════════
//   A URL that is not the canonical spelling of a page — `/ru` without its
//   slash, `/RU/` — is answered by the router with a 307. To a crawler a 307
//   is temporary: it keeps the wrong spelling and re-checks it forever. The
//   spelling will never become right, so it is said permanently, as a 308
//   (a 301 that keeps the method). Any other redirect — to sign-in, say —
//   is left temporary, as it should be.
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
