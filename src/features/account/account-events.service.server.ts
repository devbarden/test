import type { Logger } from '@/backend/observability/logger.server'
import type { ClerkWebhookEvent } from '@/backend/webhooks/clerk-webhook-verifier.server'
import type { ApplicationMaintenanceService } from '@/features/applications/application-maintenance.service.server'
import {
	type BillingWebhookService,
	isBillingEvent,
} from '@/features/billing/billing-webhook.service.server'

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
