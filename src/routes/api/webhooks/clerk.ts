import { createFileRoute } from '@tanstack/react-router'
import { systemApiScopeMiddleware } from '@/backend/middleware/api-scope.middleware'

export const Route = createFileRoute('/api/webhooks/clerk')({
	server: {
		handlers: {
			POST: async ({ context, request }) => {
				await context.scope.cradle.clerkWebhookHandler.handle(request)

				return new Response(null, { status: 204 })
			},
		},
		middleware: [systemApiScopeMiddleware('clerk-webhook')],
	},
})
