export const UNKNOWN_CLIENT_IP = 'unknown'

// ═══════════════════════════════════════════════════════════════════════════
//   Railway's edge is the one trusted proxy, and it APPENDS the peer it saw
//   to X-Forwarded-For. Every entry to the left of it was written by the
//   client and can be forged, so the trustworthy address is the rightmost
//   one. The per-IP rate limit depends on this: trusting the leftmost entry
//   would let anyone pick a fresh bucket per request. If a CDN is ever put in
//   front of Railway, switch to its own client-IP header instead.
// ═══════════════════════════════════════════════════════════════════════════
export function getClientIp(headers: Headers): string {
	const forwarded = headers
		.get('x-forwarded-for')
		?.split(',')
		.map((part) => part.trim())
		.filter(Boolean)

	return (
		forwarded?.at(-1) ?? headers.get('x-real-ip')?.trim() ?? UNKNOWN_CLIENT_IP
	)
}
