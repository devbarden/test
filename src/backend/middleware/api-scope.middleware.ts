import { createMiddleware, isCsrfRequestAllowed } from '@tanstack/react-start'
import type { SystemActor } from '../auth/actor'
import { ForbiddenError } from '../errors/app-error.server'
import { errorResponse } from '../errors/error-response.server'
import { guardSystem, guardUser } from './guard.server'

// ═══════════════════════════════════════════════════════════════════════════
//   The /api file-route counterpart of userScopeMiddleware. Two differences
//   from the RPC version:
//
//   - CSRF is checked here. The global CSRF middleware covers server
//     functions only, and these routes are authenticated by the same Clerk
//     cookie, so they must prove same-origin themselves (Sec-Fetch-Site,
//     else Origin, else Referer — the library's rules).
//   - A refusal is RETURNED as a JSON response with its real status, not
//     thrown: an error thrown out of a file route becomes a generic 500.
// ═══════════════════════════════════════════════════════════════════════════
export const userApiScopeMiddleware = createMiddleware().server(
	async (context) =>
		guardUser((scope) => context.next({ context: { scope } }), errorResponse, {
			precheck: async () => {
				if (!(await isCsrfRequestAllowed({}, context))) {
					throw new ForbiddenError('Cross-origin request refused')
				}
			},
		}),
)

// ═══════════════════════════════════════════════════════════════════════════
//   For callers that are not users — the Clerk webhook, the scheduler. They
//   authenticate by signature or shared secret in their handler; this
//   applies the per-source-and-IP budget and gives them a system scope, from
//   which no user-facing service can be resolved.
// ═══════════════════════════════════════════════════════════════════════════
export const systemApiScopeMiddleware = (source: SystemActor['source']) =>
	createMiddleware().server(async ({ next }) =>
		guardSystem(source, (scope) => next({ context: { scope } }), errorResponse),
	)
