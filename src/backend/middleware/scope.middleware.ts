import { auth } from '@clerk/tanstack-react-start/server'
import { createMiddleware } from '@tanstack/react-start'
import { getAppContainer } from '../di/container.server'
import { createUserRequestScope } from '../di/scope.server'
import { toClientError, UnauthorizedError } from '../errors.server'
import { logAndNormalizeError } from './error-handling.server'

// ═══════════════════════════════════════════════════════════════════════════
//   The guard every user-facing server function goes through, in order:
//
//   1. authentication — a Clerk session, or 401
//   2. the per-user request budget — before any work is done
//   3. a request scope — services resolved from it are bound to this user
//   4. error hygiene — whatever the handler throws is logged here and
//      replaced by a payload-only error, because the RPC serializer copies
//      every own property of a thrown object (stack, cause, Prisma
//      metadata) to the browser.
//
//   CSRF for server functions is enforced globally in start.ts.
// ═══════════════════════════════════════════════════════════════════════════
export const userScopeMiddleware = createMiddleware({
	type: 'function',
}).server(async ({ next }) => {
	const { rootLogger } = getAppContainer().cradle
	const { isAuthenticated, userId } = await auth()

	if (!isAuthenticated || !userId) {
		throw toClientError(
			logAndNormalizeError(new UnauthorizedError(), rootLogger),
		)
	}

	const scope = createUserRequestScope(userId)
	const { logger, rateLimiter } = scope.cradle

	try {
		await rateLimiter.consume('user', userId)

		return await next({ context: { scope } })
	} catch (error) {
		throw toClientError(logAndNormalizeError(error, logger))
	}
})
