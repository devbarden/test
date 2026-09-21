import { auth } from '@clerk/tanstack-react-start/server'
import { subscriptionFrom } from '@/features/billing/model/billing.catalog'
import { UnauthorizedError } from '../errors/app-error.server'
import type { UserActor } from './actor'

// ═══════════════════════════════════════════════════════════════════════════
//   Plan and features come from the session claims, so `has()` needs no call
//   to Clerk.
// ═══════════════════════════════════════════════════════════════════════════
export async function authenticate(): Promise<UserActor> {
	const { has, isAuthenticated, userId } = await auth()

	if (!isAuthenticated || !userId) throw new UnauthorizedError()

	return { ...subscriptionFrom(has), type: 'user', userId }
}
