import { auth } from '@clerk/tanstack-react-start/server'
import {
	BILLING_FEATURES,
	entitlementsFor,
	PLAN_SLUGS,
} from '@/features/billing/billing.catalog'
import type { UserActor } from '../di/actor'
import { UnauthorizedError } from '../errors.server'

// ═══════════════════════════════════════════════════════════════════════════
//   The signed-in user and what their subscription grants, from the session
//   token alone: Clerk writes the active plan and its features into the
//   claims, so `has()` answers locally, without a call to Clerk per request.
//   The token is short-lived and refreshed by the browser, so a change of
//   plan reaches the server within its lifetime (the client forces a refresh
//   right after checkout).
// ═══════════════════════════════════════════════════════════════════════════
export async function authenticate(): Promise<UserActor> {
	const { has, isAuthenticated, userId } = await auth()

	if (!isAuthenticated || !userId) throw new UnauthorizedError()

	const features = BILLING_FEATURES.filter((feature) => has({ feature }))

	return {
		entitlements: entitlementsFor(features),
		plan: has({ plan: PLAN_SLUGS.pro }) ? 'pro' : 'free',
		type: 'user',
		userId,
	}
}
