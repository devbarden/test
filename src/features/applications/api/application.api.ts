import { createServerFn } from '@tanstack/react-start'
import { userScopeMiddleware } from '@/backend/middleware/user-scope.middleware'
import { validateInput } from '@/backend/middleware/validate-input'
import {
	applicationIdSchema,
	listApplicationsSchema,
} from '../model/application.schema'

// ═══════════════════════════════════════════════════════════════════════════
//   The RPC surface of applications. Each function is three things and no
//   more: a guard (userScopeMiddleware — auth, budget, scope, error hygiene),
//   a validator for its input, and one call into the service. Logic here
//   would be logic the tests of the service do not cover.
//
//   Creating and updating letters is not here: it happens only as the
//   outcome of a generation, in the streaming /api/generate route.
// ═══════════════════════════════════════════════════════════════════════════
export const listApplications = createServerFn({ method: 'GET' })
	.middleware([userScopeMiddleware])
	.validator(validateInput(listApplicationsSchema))
	.handler(({ context, data }) =>
		context.scope.cradle.applicationService.list(data),
	)

export const getApplicationStats = createServerFn({ method: 'GET' })
	.middleware([userScopeMiddleware])
	.handler(({ context }) => context.scope.cradle.applicationService.stats())

export const getApplication = createServerFn({ method: 'GET' })
	.middleware([userScopeMiddleware])
	.validator(validateInput(applicationIdSchema))
	.handler(({ context, data }) =>
		context.scope.cradle.applicationService.get(data.id),
	)

export const deleteApplication = createServerFn({ method: 'POST' })
	.middleware([userScopeMiddleware])
	.validator(validateInput(applicationIdSchema))
	.handler(({ context, data }) =>
		context.scope.cradle.applicationService.remove(data.id),
	)

export const restoreApplication = createServerFn({ method: 'POST' })
	.middleware([userScopeMiddleware])
	.validator(validateInput(applicationIdSchema))
	.handler(({ context, data }) =>
		context.scope.cradle.applicationService.restore(data.id),
	)
