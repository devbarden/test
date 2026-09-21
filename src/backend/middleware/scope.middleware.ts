import { createMiddleware } from '@tanstack/react-start'
import { getAppContainer } from '../di/container.server'
import { toClientError } from '../errors.server'
import { logAndNormalizeError } from './error-handling.server'
import { chargeRequest, openUserScope } from './user-scope.server'

// ═══════════════════════════════════════════════════════════════════════════
//   The guard every user-facing server function goes through: a session, a
//   user-bound request scope, the per-user budget — then the handler.
//
//   Whatever is thrown is logged here and replaced by a payload-only error:
//   the RPC serializer copies every own property of a thrown object (stack,
//   cause, Prisma metadata) to the browser, so the original never leaves.
//
//   CSRF for server functions is enforced globally in start.ts.
// ═══════════════════════════════════════════════════════════════════════════
export const userScopeMiddleware = createMiddleware({
	type: 'function',
}).server(async ({ next }) => {
	const scope = await openUserScope().catch((error: unknown) => {
		throw toClientError(
			logAndNormalizeError(error, getAppContainer().cradle.rootLogger),
		)
	})

	try {
		await chargeRequest(scope)

		return await next({ context: { scope } })
	} catch (error) {
		throw toClientError(logAndNormalizeError(error, scope.cradle.logger))
	}
})
