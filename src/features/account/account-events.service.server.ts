import type { Logger } from '@/backend/observability/logger.server'
import type { ClerkWebhookEvent } from '@/backend/webhooks/clerk-webhook-verifier.server'
import type { ApplicationMaintenanceService } from '@/features/applications/application-maintenance.service.server'
import {
	type BillingWebhookService,
	isBillingEvent,
} from '@/features/billing/billing-webhook.service.server'

// ═══════════════════════════════════════════════════════════════════════════
//   What happens here when something happens to an account in Clerk — the
//   one place that maps a verified event to the features it concerns:
//
//   user.deleted      the account's letters go with it, so personal data
//                     does not outlive the person's decision to leave
//   billing events    recorded for visibility; access itself follows the
//                     plan in the session token, not these events
//   anything else     ignored, so enabling a new event in Clerk's dashboard
//                     cannot break the endpoint
//
//   Idempotent — Svix retries until it sees a 2xx, and erasing an already
//   erased user deletes nothing and succeeds.
// ═══════════════════════════════════════════════════════════════════════════
export function createAccountEventsService({
	applicationMaintenanceService,
	billingWebhookService,
	logger,
}: {
	applicationMaintenanceService: ApplicationMaintenanceService
	billingWebhookService: BillingWebhookService
	logger: Logger
}) {
	return {
		async handle(event: ClerkWebhookEvent): Promise<void> {
			if (event.type === 'user.deleted') {
				if (event.data.id) {
					await applicationMaintenanceService.eraseUser(event.data.id)
				}
				return
			}

			if (isBillingEvent(event)) {
				billingWebhookService.record(event)
				return
			}

			logger.debug({ event: event.type }, 'Ignored a Clerk webhook event')
		},
	}
}

export type AccountEventsService = ReturnType<typeof createAccountEventsService>
