import { verifyWebhook } from '@clerk/tanstack-react-start/webhooks'
import { createFileRoute } from '@tanstack/react-router'
import {
	AppError,
	errorResponse,
	ForbiddenError,
} from '@/backend/errors.server'
import { systemApiScopeMiddleware } from '@/backend/middleware/api-scope.middleware'

// ═══════════════════════════════════════════════════════════════════════════
//   Clerk → us, signed with Svix. The one event acted on is `user.deleted`:
//   an account deleted in Clerk takes its letters with it, so personal data
//   does not outlive the person's decision to leave.
//
//   Idempotent — Svix retries until it sees a 2xx, and erasing an already
//   erased user deletes nothing and succeeds. Without a signing secret the
//   endpoint reports itself unavailable rather than accepting unsigned calls.
// ═══════════════════════════════════════════════════════════════════════════
export const Route = createFileRoute('/api/webhooks/clerk')({
	server: {
		handlers: {
			POST: async ({ context, request }) => {
				const { applicationMaintenanceService, config, logger } =
					context.scope.cradle
				const signingSecret = config.clerk.webhookSigningSecret

				if (!signingSecret) {
					return errorResponse(
						new AppError('unavailable', 503, 'Clerk webhook is not configured'),
					)
				}

				const event = await verifyWebhook(request, { signingSecret }).catch(
					(cause: unknown) => {
						logger.warn({ err: cause }, 'Rejected an unsigned Clerk webhook')
						return null
					},
				)

				if (!event) return errorResponse(new ForbiddenError())

				if (event.type === 'user.deleted' && event.data.id) {
					await applicationMaintenanceService.eraseUser(event.data.id)
				}

				return new Response(null, { status: 204 })
			},
		},
		middleware: [systemApiScopeMiddleware('clerk-webhook')],
	},
})
