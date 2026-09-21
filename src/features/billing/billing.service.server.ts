import type { UserActor } from '@/backend/auth/actor'
import { budgets } from '@/backend/rate-limit/budgets'
import type { RateLimiter } from '@/backend/rate-limit/rate-limiter.server'
import type { ApplicationService } from '@/features/applications/application.service.server'
import type { BillingOverview } from './model/billing-overview'

export function createBillingService({
	applicationService,
	rateLimiter,
	userActor,
}: {
	applicationService: ApplicationService
	rateLimiter: RateLimiter
	userActor: UserActor
}) {
	const { entitlements, plan, userId } = userActor

	return {
		async overview(): Promise<BillingOverview> {
			const [applications, generations] = await Promise.all([
				applicationService.count(),
				rateLimiter.peek(
					budgets.dailyGenerations(userId, entitlements.dailyGenerations),
				),
			])

			return {
				entitlements,
				plan,
				usage: {
					applications,
					generationsResetInSeconds: generations.resetInSeconds,
					generationsToday: generations.consumed,
				},
			}
		},
	}
}

export type BillingService = ReturnType<typeof createBillingService>
