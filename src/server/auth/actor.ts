import type { Entitlements } from '@/domain/billing/billing-entitlements'
import type { PlanId } from '@/domain/billing/billing-plans'

export type UserActor = {
	entitlements: Entitlements
	plan: PlanId
	type: 'user'
	userId: string
}

export type SystemActor = {
	source: 'clerk-webhook'
	type: 'system'
}

export type Actor = UserActor | SystemActor
