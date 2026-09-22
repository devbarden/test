import { verifyWebhook, type WebhookEvent } from '@clerk/tanstack-react-start/webhooks'
import type { AppConfig } from '../config.server'
import { ForbiddenError, NotConfiguredError } from '../errors/app-error.server'

export type { WebhookEvent as ClerkWebhookEvent }

export function createClerkWebhookVerifier({ config }: { config: AppConfig }) {
	return {
		async verify(request: Request): Promise<WebhookEvent> {
			const signingSecret = config.clerk.webhookSigningSecret

			if (!signingSecret) {
				throw new NotConfiguredError('Clerk webhook is not configured')
			}

			try {
				return await verifyWebhook(request, { signingSecret })
			} catch (cause) {
				throw new ForbiddenError(`Rejected a Clerk webhook with an invalid signature: ${String(cause)}`)
			}
		},
	}
}
