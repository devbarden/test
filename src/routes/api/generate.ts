import { createFileRoute } from '@tanstack/react-router'
import { userApiScopeMiddleware } from '@/backend/middleware/api-scope.middleware'
import { ndjsonResponse } from '@/backend/web/ndjson.server'
import { readJsonBody } from '@/backend/web/request-body.server'
import { generateCommandSchema } from '@/features/generation/protocol'

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
