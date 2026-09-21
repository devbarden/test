import { describe, expect, it } from 'vitest'
import { RateLimitError } from '@/backend/errors.server'
import { silentLogger, testConfig } from '@/test/fixtures'
import { useTestRedis } from '@/test/integration/clients'
import { createRateLimiter } from './rate-limit.server'

const redis = useTestRedis()

function limiter() {
	const config = testConfig()

	config.limits.generationsPerMinute = 2

	return createRateLimiter({ config, redis, rootLogger: silentLogger })
}

describe('rateLimiter (Redis)', () => {
	it('refuses past the budget with a retry hint', async () => {
		const rateLimiter = limiter()

		await rateLimiter.consume('generationMinute', 'alice')
		await rateLimiter.consume('generationMinute', 'alice')

		const error = await rateLimiter
			.consume('generationMinute', 'alice')
			.catch((cause) => cause)

		expect(error).toBeInstanceOf(RateLimitError)
		expect(error.toPayload().retryAfterSeconds).toBeGreaterThan(0)
	})

	it('shares one budget between limiter instances, as between replicas', async () => {
		await limiter().consume('generationMinute', 'alice')
		await limiter().consume('generationMinute', 'alice')

		await expect(
			limiter().consume('generationMinute', 'alice'),
		).rejects.toBeInstanceOf(RateLimitError)
	})

	it('gives a refunded point back', async () => {
		const rateLimiter = limiter()

		await rateLimiter.consume('generationMinute', 'alice')
		await rateLimiter.consume('generationMinute', 'alice')
		await rateLimiter.refund('generationMinute', 'alice')

		await expect(
			rateLimiter.consume('generationMinute', 'alice'),
		).resolves.toBeUndefined()
	})
})
