import { AsyncLocalStorage } from 'node:async_hooks'

export type RequestContext = {
	clientIp: string
	requestId: string
}

const storage = new AsyncLocalStorage<RequestContext>()

export function runWithRequestContext<T>(
	context: RequestContext,
	callback: () => T,
): T {
	return storage.run(context, callback)
}

export function getRequestContext(): RequestContext | undefined {
	return storage.getStore()
}
