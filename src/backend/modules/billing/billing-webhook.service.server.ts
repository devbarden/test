import type { WebhookEvent } from '@clerk/tanstack-react-start/webhooks'
import type { Logger } from '@/backend/observability/logger.server'

type BillingEvent = Extract<
	WebhookEvent,
	{
		type: `subscription.${string}` | `subscriptionItem.${string}` | `paymentAttempt.${string}`
	}
>

const NEEDS_ATTENTION = new Set<BillingEvent['type']>([
	'subscription.pastDue',
	'subscriptionItem.pastDue',
	'subscriptionItem.incomplete',
])

export function isBillingEvent(event: WebhookEvent): event is BillingEvent {
	return /^(subscription|subscriptionItem|paymentAttempt)\./.test(event.type)
}

export function createBillingWebhookService({ logger }: { logger: Logger }) {
	return {
		record(event: BillingEvent): void {
			const details = {
				billingEvent: event.type,
				payerUserId: 'payer' in event.data ? event.data.payer?.user_id : undefined,
				status: 'status' in event.data ? event.data.status : undefined,
			}

			if (NEEDS_ATTENTION.has(event.type)) {
				logger.warn(details, 'Billing needs attention')
			} else {
				logger.info(details, 'Billing event')
			}
		},
	}
}

export type BillingWebhookService = ReturnType<typeof createBillingWebhookService>
