import type { DehydratedState } from '@tanstack/react-query'
import { z } from 'zod'

const KEY_PREFIX = 'alt-shift:cache:'

const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

const storedCacheSchema = z.object({
	savedAt: z.number(),
	state: z.object({
		mutations: z.array(z.any()),
		queries: z.array(z.any()),
	}),
	version: z.string(),
})

// ═══════════════════════════════════════════════════════════════════════════
//   Storage may be blocked, full or hold anything (an older build, a half-
//   written value): what does not parse, match the version or fit a month
//   is dropped rather than hydrated.
// ═══════════════════════════════════════════════════════════════════════════
export function loadCache(userId: string, version: string): DehydratedState | undefined {
	const key = cacheKey(userId)
	const stored = attempt(() => {
		const raw = localStorage.getItem(key)

		return raw ? storedCacheSchema.parse(JSON.parse(raw)) : undefined
	})

	if (stored?.version === version && Date.now() - stored.savedAt <= MAX_AGE_MS) {
		return stored.state
	}

	attempt(() => localStorage.removeItem(key))

	return undefined
}

export function saveCache(userId: string, version: string, state: DehydratedState): void {
	const key = cacheKey(userId)

	try {
		localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), state, version }))
	} catch {
		// ═════════════════════════════════════════════════════════════════════
		//   Storage full: no snapshot beats an old one shown as current.
		// ═════════════════════════════════════════════════════════════════════
		attempt(() => localStorage.removeItem(key))
	}
}

export function clearCaches(): void {
	attempt(() => {
		for (const key of Object.keys(localStorage)) {
			if (key.startsWith(KEY_PREFIX)) localStorage.removeItem(key)
		}
	})
}

function cacheKey(userId: string): string {
	return `${KEY_PREFIX}${userId}`
}

function attempt<T>(use: () => T): T | undefined {
	try {
		return use()
	} catch {
		return undefined
	}
}
