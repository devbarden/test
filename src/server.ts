import handler, { createServerEntry } from '@tanstack/react-start/server-entry'
import { getAppContainer } from '@/backend/di/container.server'
import { legacyAppRedirect } from '@/backend/http/legacy-app-paths.server'
import { asPermanentIfSpelling } from '@/backend/http/permanent-redirect.server'
import { serveRequest } from '@/backend/http/serve-request.server'
import { registerProcessLifecycle } from '@/backend/lifecycle/process-lifecycle.server'
import { machineReadableResponse } from '@/features/marketing/machine-readable.server'
import { paraglideMiddleware } from '@/paraglide/server.js'

const container = getAppContainer()

registerProcessLifecycle(container)

async function route(request: Request): Promise<Response> {
	const early =
		machineReadableResponse(new URL(request.url).pathname) ??
		legacyAppRedirect(request)

	if (early) return early

	const response = await paraglideMiddleware(request, () =>
		handler.fetch(request),
	)

	return asPermanentIfSpelling(request, response)
}

export default createServerEntry({
	fetch: (request) => serveRequest(request, container.cradle, route),
})
