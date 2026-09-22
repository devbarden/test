import type { ApplicationMaintenanceService } from '@/server/modules/applications/application-maintenance.service.server'
import { type BillingWebhookService, isBillingEvent } from '@/server/modules/billing/billing-webhook.service.server'
import type { Logger } from '@/server/observability/logger.server'
import type { ClerkWebhookEvent } from '@/server/webhooks/clerk-webhook-verifier.server'

type Deps = {
	applicationMaintenanceService: ApplicationMaintenanceService
	billingWebhookService: BillingWebhookService
	logger: Logger
}

export function createAccountEventsService({ applicationMaintenanceService, billingWebhookService, logger }: Deps) {
	return {
		async handle(event: ClerkWebhookEvent): Promise<void> {
			if (event.type === 'user.deleted') {
				if (event.data.id) await applicationMaintenanceService.eraseUser(event.data.id)
			} else if (isBillingEvent(event)) {
				billingWebhookService.record(event)
			} else {
				logger.debug({ event: event.type }, 'Ignored a Clerk webhook event')
			}
		},
	}
}

export type AccountEventsService = ReturnType<typeof createAccountEventsService>
