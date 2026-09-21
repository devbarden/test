import { describe, expect, it } from 'vitest'
import { RateLimitError } from '@/backend/errors/app-error.server'
import { silentLogger, testConfig } from '@/test/fixtures'
import { setupTestRedis } from '@/test/integration/clients'
import type { Budget } from './budgets'
import { createRateLimiter } from './rate-limiter.server'

const redis = setupTestRedis()

const perMinute: Budget = { key: 'alice', tier: 'generationMinute' }

function limiter() {
	const config = testConfig()

	config.rateLimits.generationsPerMinute = 2

	return createRateLimiter({ config, redis, rootLogger: silentLogger })
}

describe('rateLimiter (Redis)', () => {
	it('refuses past the budget with a retry hint', async () => {
		const rateLimiter = limiter()

		await rateLimiter.consume(perMinute)
		await rateLimiter.consume(perMinute)

		const error = await rateLimiter.consume(perMinute).catch((cause) => cause)

		expect(error).toBeInstanceOf(RateLimitError)
		expect(error.toPayload().retryAfterSeconds).toBeGreaterThan(0)
	})

	it('shares one budget between limiter instances, as between replicas', async () => {
		await limiter().consume(perMinute)
		await limiter().consume(perMinute)

		await expect(limiter().consume(perMinute)).rejects.toBeInstanceOf(
			RateLimitError,
		)
	})

	it('gives a refunded point back', async () => {
		const rateLimiter = limiter()

		await rateLimiter.consume(perMinute)
		await rateLimiter.consume(perMinute)
		await rateLimiter.refund(perMinute)

		await expect(rateLimiter.consume(perMinute)).resolves.toBeUndefined()
	})

	it('keeps what was spent when a plan raises the ceiling', async () => {
		const rateLimiter = limiter()
		const free: Budget = { key: 'alice', limit: 1, tier: 'generationDay' }
		const pro: Budget = { ...free, limit: 3 }

		await rateLimiter.consume(free)
		await expect(rateLimiter.consume(free)).rejects.toBeInstanceOf(
			RateLimitError,
		)

		await rateLimiter.consume(pro)

		expect(await rateLimiter.peek(pro)).toMatchObject({ consumed: 2, limit: 3 })
	})

	it('refunds the budgets already charged when a later one refuses', async () => {
		const rateLimiter = limiter()
		const quota: Budget = { key: 'alice', limit: 5, tier: 'generationDay' }

		await rateLimiter.consume(perMinute)
		await rateLimiter.consume(perMinute)

		await expect(
			rateLimiter.consumeAll([quota, perMinute]),
		).rejects.toBeInstanceOf(RateLimitError)

		expect((await rateLimiter.peek(quota)).consumed).toBe(0)
	})
})
