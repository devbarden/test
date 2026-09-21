import { vi } from 'vitest'
import { RateLimitError } from '@/backend/errors.server'
import type { GenerationApiGateway } from '@/backend/gateways/generation-api/generation-api.gateway.server'
import type {
	Budget,
	RateLimiter,
	RateLimitTier,
} from '@/backend/rate-limit/rate-limiter.server'
import type { LockService } from '@/backend/redis/lock.server'

export function createFakeRateLimiter(refused: RateLimitTier[] = []) {
	const consumed: RateLimitTier[] = []
	const refunded: RateLimitTier[] = []
	const limits: Partial<Record<RateLimitTier, number>> = {}

	const consume = async (
		tier: RateLimitTier,
		_key: string,
		options: { limit?: number } = {},
	) => {
		limits[tier] = options.limit

		if (refused.includes(tier)) {
			throw new RateLimitError(
				tier === 'generationDay' ? 'quota_exceeded' : 'rate_limited',
				30,
			)
		}

		consumed.push(tier)
	}

	const refund = async (tier: RateLimitTier) => {
		refunded.push(tier)
	}

	const limiter: RateLimiter = {
		consume: vi.fn(consume),
		consumeAll: vi.fn(async (budgets: readonly Budget[]) => {
			const charged: Budget[] = []

			try {
				for (const budget of budgets) {
					await consume(budget.tier, budget.key, budget)
					charged.push(budget)
				}
			} catch (error) {
				for (const budget of charged) await refund(budget.tier)
				throw error
			}
		}),
		peek: vi.fn(async (_tier, _key, options = {}) => ({
			consumed: 0,
			limit: options.limit ?? 0,
			resetInSeconds: 0,
		})),
		refund: vi.fn(refund),
	}

	return { consumed, limiter, limits, refunded }
}

export function createFakeLockService({ held = false } = {}) {
	const state = { acquired: 0, released: 0 }

	const lockService: LockService = {
		acquire: vi.fn(async () => {
			if (held) return null
			state.acquired += 1

			let released = false

			return {
				release: async () => {
					if (released) return
					released = true
					state.released += 1
				},
			}
		}),
	}

	return { lockService, state }
}

export function createFakeGateway(
	stream: () => AsyncGenerator<string>,
): GenerationApiGateway {
	return { openStream: vi.fn(async () => stream()) }
}
