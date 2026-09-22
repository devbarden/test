import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'

type RequestContext = {
	clientIp: string
	requestId: string
}

export const UNKNOWN_CLIENT_IP = 'unknown'

const storage = new AsyncLocalStorage<RequestContext>()

export function requestContextFrom(headers: Headers): RequestContext {
	return { clientIp: clientIpFrom(headers), requestId: requestIdFrom(headers) }
}

export function runWithRequestContext<T>(context: RequestContext, callback: () => T): T {
	return storage.run(context, callback)
}

export function getRequestContext(): RequestContext | undefined {
	return storage.getStore()
}

// ═══════════════════════════════════════════════════════════════════════════
//   Railway appends the real peer to X-Forwarded-For; everything left of it
//   is client-forgeable.
// ═══════════════════════════════════════════════════════════════════════════
function clientIpFrom(headers: Headers): string {
	const lastHop = headers.get('x-forwarded-for')?.split(',').at(-1)?.trim()

	return lastHop || headers.get('x-real-ip')?.trim() || UNKNOWN_CLIENT_IP
}

// ═══════════════════════════════════════════════════════════════════════════
//   The client can send this header too, so only a plain, bounded value is
//   kept.
// ═══════════════════════════════════════════════════════════════════════════
function requestIdFrom(headers: Headers): string {
	const id = headers.get('x-railway-request-id')

	return id && /^[\w.-]{1,128}$/.test(id) ? id : randomUUID()
}
