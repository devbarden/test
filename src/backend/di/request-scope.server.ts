import { randomUUID } from 'node:crypto'
import { asValue } from 'awilix'
import type { Actor, SystemActor, UserActor } from '../auth/actor'
import { getRequestContext } from '../http/request-context.server'
import { type AppContainer, getAppContainer } from './container.server'

// ═══════════════════════════════════════════════════════════════════════════
//   One DI scope per request, carrying who it acts for and a logger that
//   already names the request and the actor — every service resolved from
//   it logs with that context without being told.
//
//   `userActor` is registered only on a user scope. A user-facing service
//   declares it as a dependency, so resolving one from a system scope (a
//   webhook, a job) fails loudly instead of running without an owner.
// ═══════════════════════════════════════════════════════════════════════════
function createRequestScope(actor: Actor): AppContainer {
	const container = getAppContainer()
	const scope = container.createScope()
	const requestId = getRequestContext()?.requestId ?? randomUUID()
	const logger = container.cradle.rootLogger.child(
		actor.type === 'user'
			? { requestId, userId: actor.userId }
			: { requestId, source: actor.source },
	)

	scope.register({
		actor: asValue(actor),
		logger: asValue(logger),
		requestId: asValue(requestId),
	})

	if (actor.type === 'user') scope.register({ userActor: asValue(actor) })

	return scope
}

export function createUserScope(user: UserActor): AppContainer {
	return createRequestScope(user)
}

export function createSystemScope(source: SystemActor['source']): AppContainer {
	return createRequestScope({ source, type: 'system' })
}
