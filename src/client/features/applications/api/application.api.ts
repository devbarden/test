import { createServerFn } from '@tanstack/react-start'
import { applicationIdSchema, listApplicationsSchema } from '@/domain/applications/application.schema'
import { userScopeMiddleware } from '@/server/middleware/user-scope.middleware'
import { validateInput } from '@/server/middleware/validate-input'

export const listApplications = createServerFn({ method: 'GET' })
	.middleware([userScopeMiddleware])
	.validator(validateInput(listApplicationsSchema))
	.handler(({ context, data }) => context.scope.cradle.applicationService.list(data))

export const getApplicationStats = createServerFn({ method: 'GET' })
	.middleware([userScopeMiddleware])
	.handler(({ context }) => context.scope.cradle.applicationService.stats())

export const getApplication = createServerFn({ method: 'GET' })
	.middleware([userScopeMiddleware])
	.validator(validateInput(applicationIdSchema))
	.handler(({ context, data }) => context.scope.cradle.applicationService.get(data.id))

export const deleteApplication = createServerFn({ method: 'POST' })
	.middleware([userScopeMiddleware])
	.validator(validateInput(applicationIdSchema))
	.handler(({ context, data }) => context.scope.cradle.applicationService.remove(data.id))

export const restoreApplication = createServerFn({ method: 'POST' })
	.middleware([userScopeMiddleware])
	.validator(validateInput(applicationIdSchema))
	.handler(({ context, data }) => context.scope.cradle.applicationService.restore(data.id))
