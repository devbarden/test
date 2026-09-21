import type { DehydratedState } from '@tanstack/react-query'
import { z } from 'zod'

const KEY_PREFIX = 'alt-shift:cache:'

const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

function isDehydratedState(value: unknown): value is DehydratedState {
	return (
		typeof value === 'object' &&
		value !== null &&
		'queries' in value &&
		Array.isArray(value.queries) &&
		'mutations' in value &&
		Array.isArray(value.mutations)
	)
}

const storedCacheSchema = z.object({
	savedAt: z.number(),
	state: z.custom<DehydratedState>(isDehydratedState),
	version: z.string(),
})

// ═══════════════════════════════════════════════════════════════════════════
//   One user's query cache in localStorage. Storage may be blocked (access
//   throws), full (a write throws) or hold anything — an older build, a
//   half-written value — so every access tolerates all three, and a cache
//   that does not parse, belongs to another version or is over a month old
//   is dropped rather than hydrated.
// ═══════════════════════════════════════════════════════════════════════════
export function loadCache(
	userId: string,
	version: string,
): DehydratedState | undefined {
	const key = cacheKey(userId)
	const stored = parse(withStorage((storage) => storage.getItem(key), null))

	if (
		stored?.version === version &&
		Date.now() - stored.savedAt <= MAX_AGE_MS
	) {
		return stored.state
	}

	withStorage((storage) => storage.removeItem(key), undefined)

	return undefined
}

export function saveCache(
	userId: string,
	version: string,
	state: DehydratedState,
): void {
	const value = JSON.stringify({ savedAt: Date.now(), state, version })

	withStorage((storage) => storage.setItem(cacheKey(userId), value), undefined)
}

export function clearCaches(): void {
	withStorage((storage) => {
		for (const key of Object.keys(storage)) {
			if (key.startsWith(KEY_PREFIX)) storage.removeItem(key)
		}
	}, undefined)
}

function cacheKey(userId: string): string {
	return `${KEY_PREFIX}${userId}`
}

function parse(raw: string | null) {
	if (!raw) return undefined

	try {
		const parsed = storedCacheSchema.safeParse(JSON.parse(raw))

		return parsed.success ? parsed.data : undefined
	} catch {
		return undefined
	}
}

function withStorage<T>(use: (storage: Storage) => T, fallback: T): T {
	try {
		return use(window.localStorage)
	} catch {
		return fallback
	}
}
