import type { UserActor } from '@/backend/auth/actor'
import type { ApplicationService } from '@/backend/modules/applications/application.service.server'
import { budgets } from '@/backend/rate-limit/budgets'
import type { RateLimiter } from '@/backend/rate-limit/rate-limiter.server'
import type { BillingOverview } from '@/domain/billing/billing-overview'

export function createBillingService({
	applicationService,
	rateLimiter,
	userActor,
}: {
	applicationService: ApplicationService
	rateLimiter: RateLimiter
	userActor: UserActor
}) {
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
