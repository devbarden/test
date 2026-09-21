import { createFileRoute } from '@tanstack/react-router'
import { systemApiScopeMiddleware } from '@/backend/middleware/api-scope.middleware'

export const Route = createFileRoute('/api/cron/$job')({
	server: {
		handlers: {
			POST: async ({ context, params, request }) =>
				Response.json(
					await context.scope.cradle.jobRunner.run(
						params.job,
						request.headers.get('authorization'),
					),
				),
		},
		middleware: [systemApiScopeMiddleware('cron')],
	},
})
