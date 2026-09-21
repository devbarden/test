type RateLimiterOptions = {
	limit: number
	now?: () => number
	windowMs: number
}

export type RateLimitDecision =
	| { allowed: true }
	| { allowed: false; retryAfterSeconds: number }

// ═══════════════════════════════════════════════════════════════════════════
//   A sliding-window log kept in process memory. It exists because the
//   upstream allows 6 requests a minute for the whole TOKEN — that is, for
//   every user of this deployment together — so one person mashing
//   "Try Again" must not be able to lock everybody else out.
//
//   In memory is the honest size for one Railway instance. Scaling out means
//   moving this map to Redis behind the same `consume` signature; nothing
//   that calls it would change.
// ═══════════════════════════════════════════════════════════════════════════
export function createRateLimiter({
	limit,
	now = Date.now,
	windowMs,
}: RateLimiterOptions) {
	const hitsByKey = new Map<string, number[]>()

	return {
		consume(key: string): RateLimitDecision {
			const currentTime = now()
			const windowStart = currentTime - windowMs
			const hits = (hitsByKey.get(key) ?? []).filter((hit) => hit > windowStart)

			if (hits.length >= limit) {
				hitsByKey.set(key, hits)
				const oldest = hits[0] ?? currentTime
				const retryAfterMs = oldest + windowMs - currentTime

				return {
					allowed: false,
					retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
				}
			}

			hitsByKey.set(key, [...hits, currentTime])

			return { allowed: true }
		},
	}
}
