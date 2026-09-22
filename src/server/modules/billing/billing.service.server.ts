import type { BillingOverview } from '@/domain/billing/billing-overview'
import type { UserActor } from '@/server/auth/actor'
import type { ApplicationService } from '@/server/modules/applications/application.service.server'
import { budgets } from '@/server/rate-limit/budgets'
import type { RateLimiter } from '@/server/rate-limit/rate-limiter.server'

type Deps = {
	applicationService: ApplicationService
	rateLimiter: RateLimiter
	userActor: UserActor
}

export function createBillingService({ applicationService, rateLimiter, userActor }: Deps) {
	const { entitlements, plan } = userActor

	return {
		async overview(): Promise<BillingOverview> {
			const [applications, generations] = await Promise.all([
				applicationService.count(),
				rateLimiter.peek(budgets.dailyGenerations(userActor)),
			])

			return {
				entitlements,
				plan,
				usage: {
					applications,
					generationsInWindow: generations.consumed,
					generationsResetInSeconds: generations.resetInSeconds,
				},
			}
		},
	}
}

export type BillingService = ReturnType<typeof createBillingService>
