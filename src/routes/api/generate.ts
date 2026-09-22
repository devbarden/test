import { createFileRoute } from '@tanstack/react-router'
import { generateCommandSchema } from '@/domain/generation/generation.schema'
import { ndjsonResponse } from '@/server/http/ndjson.server'
import { readJsonBody } from '@/server/http/request-body.server'
import { userApiScopeMiddleware } from '@/server/middleware/api-scope.middleware'

const MAX_BODY_BYTES = 16 * 1024

export const Route = createFileRoute('/api/generate')({
	server: {
		handlers: {
			POST: async ({ context, request }) => {
				const command = generateCommandSchema.parse(await readJsonBody(request, MAX_BODY_BYTES))
				const events = await context.scope.cradle.generationService.start(command, request.signal)

				return ndjsonResponse(events)
			},
		},
		middleware: [userApiScopeMiddleware],
	},
})
