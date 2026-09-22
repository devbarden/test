import { createServerFn } from '@tanstack/react-start'
import { userScopeMiddleware } from '@/server/middleware/user-scope.middleware'

export const getBillingOverview = createServerFn({ method: 'GET' })
	.middleware([userScopeMiddleware])
	.handler(({ context }) => context.scope.cradle.billingService.overview())
