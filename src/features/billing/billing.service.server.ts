import type { UserActor } from '@/backend/auth/actor'
import { budgets } from '@/backend/rate-limit/budgets'
import type { RateLimiter } from '@/backend/rate-limit/rate-limiter.server'
import type { ApplicationService } from '@/features/applications/application.service.server'
import type { BillingOverview } from './model/billing-overview'

// ═══════════════════════════════════════════════════════════════════════════
//   What the signed-in user's plan grants and how much of it is used — the
//   numbers the UI turns into "7 letters left today" and upgrade prompts.
//   Usage is read from the same counters that enforce it (the daily quota
//   budget in Redis, the application count behind the cap), so the screen
//   can never promise a letter the server would then refuse.
// ═══════════════════════════════════════════════════════════════════════════
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
