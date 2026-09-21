import { randomUUID } from 'node:crypto'

const REQUEST_ID_PATTERN = /^[\w.-]{1,128}$/

// ═══════════════════════════════════════════════════════════════════════════
//   Railway's edge tags each request with an id, which is reused so a log
//   line here matches the edge's HTTP log. The header can also arrive from
//   the client, though, and the value lands in every log line and in the
//   X-Request-Id response header — so it is accepted only in a plain,
//   bounded shape and replaced otherwise.
// ═══════════════════════════════════════════════════════════════════════════
export function requestIdFrom(headers: Headers): string {
	const candidate = headers.get('x-railway-request-id')

	return candidate && REQUEST_ID_PATTERN.test(candidate)
		? candidate
		: randomUUID()
}
