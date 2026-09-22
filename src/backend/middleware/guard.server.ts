import type { SystemActor } from '../auth/actor'
import { authenticate } from '../auth/authenticate.server'
import { type AppContainer, getAppContainer } from '../di/container.server'
import { createSystemScope, createUserScope } from '../di/request-scope.server'
import type { AppError } from '../errors/app-error.server'
import { logAndNormalizeError } from '../errors/log-error.server'
import { getRequestContext, UNKNOWN_CLIENT_IP } from '../http/request-context.server'
import { budgets } from '../rate-limit/budgets'

type Handle<T> = (scope: AppContainer) => T | Promise<T>

type Refuse<R> = (error: AppError) => R

type GuardOptions = { precheck?: () => Promise<void> }

export async function guardUser<T, R>(
	handle: Handle<T>,
	refuse: Refuse<R>,
	{ precheck }: GuardOptions = {},
): Promise<T | R> {
	let scope: AppContainer | undefined

	try {
		await precheck?.()

		scope = createUserScope(await authenticate())

		const { rateLimiter, userActor } = scope.cradle

		await rateLimiter.consume(budgets.user(userActor.userId))

		return await handle(scope)
	} catch (error) {
		const logger = scope?.cradle.logger ?? getAppContainer().cradle.rootLogger

		return refuse(logAndNormalizeError(error, logger))
	}
}

export async function guardSystem<T, R>(
	source: SystemActor['source'],
	handle: Handle<T>,
	refuse: Refuse<R>,
): Promise<T | R> {
	const scope = createSystemScope(source)
	const clientIp = getRequestContext()?.clientIp ?? UNKNOWN_CLIENT_IP

	try {
		await scope.cradle.rateLimiter.consume(budgets.system(source, clientIp))

		return await handle(scope)
	} catch (error) {
		return refuse(logAndNormalizeError(error, scope.cradle.logger))
	}
}
