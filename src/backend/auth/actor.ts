import type {
	Entitlements,
	PlanId,
} from '@/features/billing/model/billing.catalog'

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
