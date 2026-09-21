import {
	verifyWebhook,
	type WebhookEvent,
} from '@clerk/tanstack-react-start/webhooks'
import type { ApplicationMaintenanceService } from '@/features/applications/application-maintenance.service.server'
import {
	type BillingWebhookService,
	isBillingEvent,
} from '@/features/billing/billing-webhook.service.server'
import type { AppConfig } from '../config.server'
import { AppError, ForbiddenError } from '../errors.server'
import type { Logger } from '../observability/logger.server'

type ClerkWebhookDeps = {
	applicationMaintenanceService: ApplicationMaintenanceService
	billingWebhookService: BillingWebhookService
	config: AppConfig
	logger: Logger
}

// ═══════════════════════════════════════════════════════════════════════════
//   Clerk → us, signed with Svix. `user.deleted` is acted on — an account
//   deleted in Clerk takes its letters with it, so personal data does not
//   outlive the person's decision to leave. Billing events (subscription,
//   subscription item, payment attempt) are recorded for visibility; access
//   itself follows the plan in the session token, not these events.
//
//   Idempotent — Svix retries until it sees a 2xx, and erasing an already
//   erased user deletes nothing and succeeds. Without a signing secret the
//   endpoint reports itself unavailable rather than accepting unsigned calls.
// ═══════════════════════════════════════════════════════════════════════════
export function createClerkWebhookHandler({
	applicationMaintenanceService,
	billingWebhookService,
	config,
	logger,
}: ClerkWebhookDeps) {
	async function verify(request: Request): Promise<WebhookEvent> {
		const signingSecret = config.clerk.webhookSigningSecret

		if (!signingSecret) {
			throw new AppError('unavailable', 503, 'Clerk webhook is not configured')
		}

		try {
			return await verifyWebhook(request, { signingSecret })
		} catch (cause) {
			throw new ForbiddenError(
				`Rejected a Clerk webhook with an invalid signature: ${String(cause)}`,
			)
		}
	}

	async function dispatch(event: WebhookEvent): Promise<void> {
		if (event.type === 'user.deleted' && event.data.id) {
			await applicationMaintenanceService.eraseUser(event.data.id)
			return
		}

		if (isBillingEvent(event)) {
			billingWebhookService.record(event)
			return
		}

		logger.debug({ event: event.type }, 'Ignored a Clerk webhook event')
	}

	return {
		async handle(request: Request): Promise<void> {
			await dispatch(await verify(request))
		},
	}
}

export type ClerkWebhookHandler = ReturnType<typeof createClerkWebhookHandler>
