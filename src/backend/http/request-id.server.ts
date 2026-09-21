import { randomUUID } from 'node:crypto'

const REQUEST_ID_PATTERN = /^[\w.-]{1,128}$/

// ═══════════════════════════════════════════════════════════════════════════
//   The client can send this header too, so only a plain, bounded value is
//   kept.
// ═══════════════════════════════════════════════════════════════════════════
export function requestIdFrom(headers: Headers): string {
	const candidate = headers.get('x-railway-request-id')

	return candidate && REQUEST_ID_PATTERN.test(candidate)
		? candidate
		: randomUUID()
}
