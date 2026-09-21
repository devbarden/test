import type {
	Entitlements,
	PlanId,
} from '@/features/billing/model/billing.catalog'

// ═══════════════════════════════════════════════════════════════════════════
//   Who a request acts for. A user scope carries the signed-in user together
//   with what their subscription grants — read once per request from the
//   Clerk session claims, so every limit in the request is decided against
//   the same answer. A system scope carries the trusted caller that is NOT a
//   user (a webhook verified by signature, the scheduler verified by
//   secret). Services that read `userActor` can only be resolved from a
//   user scope — see di/request-scope.
// ═══════════════════════════════════════════════════════════════════════════
export type UserActor = {
	entitlements: Entitlements
	plan: PlanId
	type: 'user'
	userId: string
}

export type SystemActor = {
	source: 'clerk-webhook' | 'cron'
	type: 'system'
}

export type Actor = UserActor | SystemActor
