import { createServerFn } from '@tanstack/react-start'
import { userScopeMiddleware } from '@/backend/middleware/scope.middleware'

export const getBillingOverview = createServerFn({ method: 'GET' })
	.middleware([userScopeMiddleware])
	.handler(({ context }) => context.scope.cradle.billingService.overview())
