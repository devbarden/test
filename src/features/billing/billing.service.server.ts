import type { UserActor } from '@/backend/di/actor'
import type { RateLimiter } from '@/backend/rate-limit/rate-limiter.server'
import type { ApplicationRepository } from '@/features/applications/application.repository.server'
import type { BillingOverview } from './billing.schema'

type BillingServiceDeps = {
	applicationRepository: ApplicationRepository
	rateLimiter: RateLimiter
	userActor: UserActor
}

// ═══════════════════════════════════════════════════════════════════════════
//   What the signed-in user's plan grants and how much of it is used — the
//   numbers the UI turns into "7 letters left today" and upgrade prompts.
//   Usage is read from the same counters that enforce it (the daily quota
//   in Redis, the application count in Postgres), so the screen can never
//   promise a letter the server would then refuse.
// ═══════════════════════════════════════════════════════════════════════════
export function createBillingService({
	applicationRepository,
	rateLimiter,
	userActor,
}: BillingServiceDeps) {
	const { entitlements, plan, userId } = userActor

	return {
		async overview(): Promise<BillingOverview> {
			const [applications, generations] = await Promise.all([
				applicationRepository.countActive(userId),
				rateLimiter.peek('generationDay', userId, {
					limit: entitlements.dailyGenerations,
				}),
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
