// ═══════════════════════════════════════════════════════════════════════════
//   No script-src: Clerk loads scripts from its own and Cloudflare's domains.
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
