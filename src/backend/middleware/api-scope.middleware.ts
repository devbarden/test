import { auth } from '@clerk/tanstack-react-start/server'
import { createMiddleware, isCsrfRequestAllowed } from '@tanstack/react-start'
import type { SystemActor } from '../di/actor'
import { getAppContainer } from '../di/container.server'
import {
	createSystemRequestScope,
	createUserRequestScope,
} from '../di/scope.server'
import {
	errorResponse,
	ForbiddenError,
	UnauthorizedError,
} from '../errors.server'
import { getRequestContext } from '../web/request-context.server'
import { logAndNormalizeError } from './error-handling.server'

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
	async (context) => {
		const { rootLogger } = getAppContainer().cradle

		try {
			if (!(await isCsrfRequestAllowed({}, context))) {
				throw new ForbiddenError('Cross-origin request refused')
			}

			const { isAuthenticated, userId } = await auth()

			if (!isAuthenticated || !userId) throw new UnauthorizedError()

			const scope = createUserRequestScope(userId)

			try {
				await scope.cradle.rateLimiter.consume('user', userId)

				return await context.next({ context: { scope } })
			} catch (error) {
				return errorResponse(logAndNormalizeError(error, scope.cradle.logger))
			}
		} catch (error) {
			return errorResponse(logAndNormalizeError(error, rootLogger))
		}
	},
)

// ═══════════════════════════════════════════════════════════════════════════
//   For callers that are not users — the Clerk webhook, the scheduler. They
//   authenticate by signature or shared secret inside the handler; this
//   applies the per-IP webhook budget and gives them a system scope, from
//   which no user-facing service can be resolved.
// ═══════════════════════════════════════════════════════════════════════════
export const systemApiScopeMiddleware = (source: SystemActor['source']) =>
	createMiddleware().server(async ({ next }) => {
		const scope = createSystemRequestScope(source)
		const clientIp = getRequestContext()?.clientIp ?? 'unknown'

		try {
			await scope.cradle.rateLimiter.consume('webhook', `${source}:${clientIp}`)

			return await next({ context: { scope } })
		} catch (error) {
			return errorResponse(logAndNormalizeError(error, scope.cradle.logger))
		}
	})
