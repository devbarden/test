import { auth } from '@clerk/tanstack-react-start/server'
import { subscriptionFrom } from '@/features/billing/model/billing.catalog'
import { UnauthorizedError } from '../errors/app-error.server'
import type { UserActor } from './actor'

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

	return { ...subscriptionFrom(has), type: 'user', userId }
}
