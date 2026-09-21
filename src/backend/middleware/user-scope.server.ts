import type { AppContainer } from '../di/container.server'
import { createUserRequestScope } from '../di/scope.server'
import { authenticate } from './authenticate.server'

// ═══════════════════════════════════════════════════════════════════════════
//   The two halves every user guard shares, whatever it runs in front of:
//
//   openUserScope    who is calling (a Clerk session, or 401) and a request
//                    scope bound to them — from here on every log line and
//                    every service knows the user
//   chargeRequest    the per-user request budget, charged before any work
//
//   They are separate so a refusal of the budget is already logged with the
//   user's scope, not anonymously.
// ═══════════════════════════════════════════════════════════════════════════
export async function openUserScope(): Promise<AppContainer> {
	return createUserRequestScope(await authenticate())
}

export async function chargeRequest(scope: AppContainer): Promise<void> {
	const { rateLimiter, userActor } = scope.cradle

	await rateLimiter.consume('user', userActor.userId)
}
