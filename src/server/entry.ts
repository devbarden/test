import handler, { createServerEntry } from '@tanstack/react-start/server-entry'
import { getAppContainer } from '@/server/di/container.server'
import { serveRequest } from '@/server/http/serve-request.server'
import { registerProcessLifecycle } from '@/server/lifecycle/process-lifecycle.server'

const container = getAppContainer()

registerProcessLifecycle(container)

export default createServerEntry({
	fetch: (request) => serveRequest(request, container.cradle, handler.fetch),
})
