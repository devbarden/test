// ═══════════════════════════════════════════════════════════════════════════
//   Applied to every response by the server entry.
//
//   The CSP is deliberately limited to the directives that cannot break the
//   app: no framing (clickjacking), no <base> hijack, no plugins, forms post
//   only to us. A script-src policy is left out on purpose — Clerk loads its
//   UI and bot protection from its own and Cloudflare's domains, and a
//   policy that drifts from theirs fails as a blank sign-in page in
//   production. It belongs with a nonce-based setup, not a guessed allowlist.
// ═══════════════════════════════════════════════════════════════════════════
const BASE_HEADERS: Record<string, string> = {
	'Content-Security-Policy':
		"frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
	'Cross-Origin-Opener-Policy': 'same-origin',
	'Cross-Origin-Resource-Policy': 'same-origin',
	'Permissions-Policy':
		'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
}

const HSTS = 'max-age=31536000; includeSubDomains'

export function withSecurityHeaders(
	response: Response,
	{
		isProduction,
		requestId,
		robots,
	}: { isProduction: boolean; requestId: string; robots?: string },
): Response {
	const headers = new Headers(response.headers)

	for (const [name, value] of Object.entries(BASE_HEADERS)) {
		if (!headers.has(name)) headers.set(name, value)
	}

	if (isProduction) headers.set('Strict-Transport-Security', HSTS)

	if (robots) headers.set('X-Robots-Tag', robots)

	headers.set('X-Request-Id', requestId)
	headers.delete('X-Powered-By')

	return new Response(response.body, {
		headers,
		status: response.status,
		statusText: response.statusText,
	})
}
