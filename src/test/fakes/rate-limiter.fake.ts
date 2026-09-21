import { vi } from 'vitest'
import { RateLimitError } from '@/backend/errors/app-error.server'
import type { Budget } from '@/backend/rate-limit/budgets'
import type { RateLimitTier } from '@/backend/rate-limit/rate-limit-tiers'
import type { RateLimiter } from '@/backend/rate-limit/rate-limiter.server'

// ═══════════════════════════════════════════════════════════════════════════
//   Records which tiers were charged and refunded, and refuses the tiers it
//   is told to — so a test can assert what a refusal cost, not only that it
//   happened. `consumeAll` keeps the real contract: refund what was charged
//   before a later budget refused.
// ═══════════════════════════════════════════════════════════════════════════
export function createFakeRateLimiter(refused: RateLimitTier[] = []) {
	const consumed: RateLimitTier[] = []
	const refunded: RateLimitTier[] = []
	const limits: Partial<Record<RateLimitTier, number>> = {}

	const consume = async (budget: Budget) => {
		if ('limit' in budget) limits[budget.tier] = budget.limit

		if (refused.includes(budget.tier)) {
			throw new RateLimitError(
				budget.tier === 'generationDay' ? 'quota_exceeded' : 'rate_limited',
				30,
			)
		}

		consumed.push(budget.tier)
	}

	const refund = async (budget: Budget) => {
		refunded.push(budget.tier)
	}

	const limiter: RateLimiter = {
		consume: vi.fn(consume),
		consumeAll: vi.fn(async (budgets: readonly Budget[]) => {
			const charged: Budget[] = []

			try {
				for (const budget of budgets) {
					await consume(budget)
					charged.push(budget)
				}
			} catch (error) {
				for (const budget of charged) await refund(budget)
				throw error
			}
		}),
		peek: vi.fn(async (budget: Budget) => ({
			consumed: 0,
			limit: 'limit' in budget ? budget.limit : 0,
			resetInSeconds: 0,
		})),
		refund: vi.fn(refund),
	}

	return { consumed, limiter, limits, refunded }
}
