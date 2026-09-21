import {
	verifyWebhook,
	type WebhookEvent,
} from '@clerk/tanstack-react-start/webhooks'
import type { AppConfig } from '../config.server'
import { ForbiddenError, NotConfiguredError } from '../errors/app-error.server'

export type { WebhookEvent as ClerkWebhookEvent }

// ═══════════════════════════════════════════════════════════════════════════
//   Clerk → us, signed with Svix. This is only the transport: it proves the
//   request came from Clerk and hands back the typed event. What an event
//   MEANS is decided by the features (account-events.service), so this
//   layer never learns about letters or subscriptions.
//
//   Without a signing secret the endpoint reports itself unavailable rather
//   than accepting unsigned calls.
// ═══════════════════════════════════════════════════════════════════════════
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
				throw new ForbiddenError(
					`Rejected a Clerk webhook with an invalid signature: ${String(cause)}`,
				)
			}
		},
	}
}

export type ClerkWebhookVerifier = ReturnType<typeof createClerkWebhookVerifier>
