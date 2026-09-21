export const UNKNOWN_CLIENT_IP = 'unknown'

// ═══════════════════════════════════════════════════════════════════════════
//   Railway appends the real peer to X-Forwarded-For; everything left of it
//   is client-forgeable.
// ═══════════════════════════════════════════════════════════════════════════
export function getClientIp(headers: Headers): string {
	const forwarded = headers
		.get('x-forwarded-for')
		?.split(',')
		.map((part) => part.trim())
		.filter(Boolean)

	return (
		forwarded?.at(-1) || headers.get('x-real-ip')?.trim() || UNKNOWN_CLIENT_IP
	)
}
