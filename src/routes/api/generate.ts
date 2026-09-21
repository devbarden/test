import { createFileRoute } from '@tanstack/react-router'
import { ndjsonResponse } from '@/backend/http/ndjson.server'
import { readJsonBody } from '@/backend/http/request-body.server'
import { userApiScopeMiddleware } from '@/backend/middleware/api-scope.middleware'
import { generateCommandSchema } from '@/features/generation/model/protocol'

// ═══════════════════════════════════════════════════════════════════════════
//   Four short fields: 16 kB is generous for multi-byte text and JSON
//   escaping, and refuses anything else before it is buffered.
// ═══════════════════════════════════════════════════════════════════════════
const MAX_BODY_BYTES = 16 * 1024

export const Route = createFileRoute('/api/generate')({
	server: {
		handlers: {
			POST: async ({ context, request }) => {
				const command = generateCommandSchema.parse(
					await readJsonBody(request, MAX_BODY_BYTES),
				)
				const events = await context.scope.cradle.generationService.start(
					command,
					request.signal,
				)

				return ndjsonResponse(events)
			},
		},
		middleware: [userApiScopeMiddleware],
	},
})
