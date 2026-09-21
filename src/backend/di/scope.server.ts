import { randomUUID } from 'node:crypto'
import { asValue } from 'awilix'
import { getRequestContext } from '../web/request-context.server'
import type { Actor, SystemActor, UserActor } from './actor'
import { type AppContainer, getAppContainer } from './container.server'

function buildScope(actor: Actor): AppContainer {
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

export function createUserRequestScope(user: UserActor): AppContainer {
	return buildScope(user)
}

export function createSystemRequestScope(
	source: SystemActor['source'],
): AppContainer {
	return buildScope({ source, type: 'system' })
}
