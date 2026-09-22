import { createMiddleware, isCsrfRequestAllowed } from '@tanstack/react-start'
import type { SystemActor } from '../auth/actor'
import { ForbiddenError } from '../errors/app-error.server'
import { errorResponse } from '../errors/error-response.server'
import { guardSystem, guardUser } from './guard.server'

// ═══════════════════════════════════════════════════════════════════════════
//   CSRF is checked here (the global one covers server functions only); a
//   refusal is returned, since a throw becomes a 500.
// ═══════════════════════════════════════════════════════════════════════════
export const userApiScopeMiddleware = createMiddleware().server(async (context) =>
	guardUser((scope) => context.next({ context: { scope } }), errorResponse, {
		precheck: async () => {
			if (!(await isCsrfRequestAllowed({}, context))) {
				throw new ForbiddenError('Cross-origin request refused')
			}
		},
	}),
)

export const systemApiScopeMiddleware = (source: SystemActor['source']) =>
	createMiddleware().server(async ({ next }) =>
		guardSystem(source, (scope) => next({ context: { scope } }), errorResponse),
	)
