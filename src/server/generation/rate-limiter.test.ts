import { describe, expect, it } from 'vitest'
import { createRateLimiter } from './rate-limiter'

function setup() {
	let time = 0
	const limiter = createRateLimiter({
		limit: 2,
		now: () => time,
		windowMs: 60_000,
	})

	return {
		advance: (ms: number) => {
			time += ms
		},
		limiter,
	}
}

describe('createRateLimiter', () => {
	it('allows up to the limit and then reports when the oldest hit expires', () => {
		const { advance, limiter } = setup()

		expect(limiter.consume('user')).toEqual({ allowed: true })
		advance(10_000)
		expect(limiter.consume('user')).toEqual({ allowed: true })
		advance(5_000)

		expect(limiter.consume('user')).toEqual({
			allowed: false,
			retryAfterSeconds: 45,
		})
	})

	it('frees capacity as hits slide out of the window', () => {
		const { advance, limiter } = setup()

		limiter.consume('user')
		limiter.consume('user')
		advance(60_001)

		expect(limiter.consume('user')).toEqual({ allowed: true })
	})

	it('does not count refused attempts against the window', () => {
		const { advance, limiter } = setup()

		limiter.consume('user')
		limiter.consume('user')
		advance(30_000)
		limiter.consume('user')
		advance(30_001)

		expect(limiter.consume('user')).toEqual({ allowed: true })
	})

	it('keeps separate budgets per key', () => {
		const { limiter } = setup()

		limiter.consume('a')
		limiter.consume('a')

		expect(limiter.consume('b')).toEqual({ allowed: true })
	})
})
