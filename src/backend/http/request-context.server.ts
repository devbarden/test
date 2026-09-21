import { AsyncLocalStorage } from 'node:async_hooks'

export type RequestContext = {
	clientIp: string
	requestId: string
}

const storage = new AsyncLocalStorage<RequestContext>()

// ═══════════════════════════════════════════════════════════════════════════
//   Set once by the server entry for the whole life of a request, so any
//   code below it — a middleware, a service, the logger of a request scope —
//   can read the request id and client IP without it being threaded through
//   every function signature.
// ═══════════════════════════════════════════════════════════════════════════
export function runWithRequestContext<T>(
	context: RequestContext,
	callback: () => T,
): T {
	return storage.run(context, callback)
}

export function getRequestContext(): RequestContext | undefined {
	return storage.getStore()
}
