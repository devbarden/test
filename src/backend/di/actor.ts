// ═══════════════════════════════════════════════════════════════════════════
//   Who a request acts for. A user scope carries the signed-in user; a
//   system scope carries the trusted caller that is NOT a user (a webhook
//   verified by signature, the scheduler verified by secret). Services that
//   read `userActor` can only be resolved from a user scope — see scope.
// ═══════════════════════════════════════════════════════════════════════════
export type UserActor = {
	type: 'user'
	userId: string
}

export type SystemActor = {
	source: 'clerk-webhook' | 'cron'
	type: 'system'
}

export type Actor = UserActor | SystemActor
