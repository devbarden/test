import { asFunction } from 'awilix'
import { createBillingService } from './billing.service.server'
import { createBillingWebhookService } from './billing-webhook.service.server'

export const billingModule = {
	billingService: asFunction(createBillingService).scoped(),
	billingWebhookService: asFunction(createBillingWebhookService).scoped(),
}
