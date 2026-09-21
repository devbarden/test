import handler, { createServerEntry } from '@tanstack/react-start/server-entry'
import { getAppContainer } from '@/backend/di/container.server'
import { serveRequest } from '@/backend/http/serve-request.server'
import { registerProcessLifecycle } from '@/backend/lifecycle/process-lifecycle.server'

const container = getAppContainer()

registerProcessLifecycle(container)

export default createServerEntry({
	fetch: (request) => serveRequest(request, container.cradle, handler.fetch),
})
