import { vi } from 'vitest'
import type { LockService } from '@/backend/cache/lock.server'
import { RateLimitError } from '@/backend/errors.server'
import type { GenerationApiGateway } from '@/backend/gateways/generation-api/generation-api.gateway.server'
import type {
	RateLimiter,
	RateLimitTier,
} from '@/backend/web/rate-limit.server'

export function createFakeRateLimiter(refused: RateLimitTier[] = []) {
	const consumed: RateLimitTier[] = []
	const refunded: RateLimitTier[] = []

	const limiter: RateLimiter = {
		consume: vi.fn(async (tier: RateLimitTier) => {
			if (refused.includes(tier)) {
				throw new RateLimitError(
					tier === 'generationDay' ? 'quota_exceeded' : 'rate_limited',
					30,
				)
			}
			consumed.push(tier)
		}),
		refund: vi.fn(async (tier: RateLimitTier) => {
			refunded.push(tier)
		}),
	}

	return { consumed, limiter, refunded }
}

export function createFakeLockService({ held = false } = {}) {
	const state = { acquired: 0, released: 0 }

	const lockService: LockService = {
		acquire: vi.fn(async () => {
			if (held) return null
			state.acquired += 1

			return {
				release: async () => {
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
