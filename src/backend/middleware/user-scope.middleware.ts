import { createMiddleware } from '@tanstack/react-start'
import { toClientError } from '../errors/error-response.server'
import { guardUser } from './guard.server'

// ═══════════════════════════════════════════════════════════════════════════
//   The guard every user-facing server function goes through: a session, a
//   user-bound request scope, the per-user budget — then the handler (see
//   guard.server).
//
//   A refusal is THROWN as a payload-only error: the RPC serializer copies
//   every own property of a thrown object to the browser, so the original
//   never leaves. CSRF for server functions is enforced globally in
//   start.ts.
// ═══════════════════════════════════════════════════════════════════════════
export const userScopeMiddleware = createMiddleware({
	type: 'function',
}).server(async ({ next }) =>
	guardUser(
		(scope) => next({ context: { scope } }),
		(error) => {
			throw toClientError(error)
		},
	),
)
