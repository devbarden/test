import { createMiddleware } from '@tanstack/react-start'
import { toServerFnError } from '../errors/error-response.server'
import { guardUser } from './guard.server'

export const userScopeMiddleware = createMiddleware({
	type: 'function',
}).server(async ({ next }) =>
	guardUser(
		(scope) => next({ context: { scope } }),
		(error) => {
			throw toServerFnError(error)
		},
	),
)
