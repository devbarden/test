import { auth } from '@clerk/tanstack-react-start/server'
import { subscriptionFrom } from '@/domain/billing/billing.catalog'
import { UnauthorizedError } from '../errors/app-error.server'
import type { UserActor } from './actor'

export async function authenticate(): Promise<UserActor> {
	const { has, isAuthenticated, userId } = await auth()

	if (!isAuthenticated || !userId) throw new UnauthorizedError()

	return { ...subscriptionFrom(has), type: 'user', userId }
}
