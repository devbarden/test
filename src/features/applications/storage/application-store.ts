import { z } from 'zod'
import { type Application, applicationSchema } from '../model/application'

const STORAGE_VERSION = 1

const storedDocumentSchema = z.object({
	applications: z.array(z.unknown()),
	version: z.literal(STORAGE_VERSION),
})

export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>

type ApplicationStoreOptions = {
	key: string
	storage: KeyValueStorage
	subscribeToExternalChanges?: (onChange: () => void) => () => void
}

export type ApplicationStore = ReturnType<typeof createApplicationStore>

const EMPTY: readonly Application[] = Object.freeze([])

// ═══════════════════════════════════════════════════════════════════════════
//   An external store in the useSyncExternalStore sense, over a key-value
//   storage. Three properties the UI relies on:
//
//   - `getSnapshot` is referentially stable while the stored string is
//     unchanged, so React re-renders only when something was written.
//   - Writes by another tab arrive through `subscribeToExternalChanges`
//     (the `storage` event in a browser), so a letter deleted in one tab
//     disappears from the other without a reload.
//   - Parsing is per item. One corrupted entry — a manual edit in devtools,
//     a half-written value — costs that entry, not the whole list.
// ═══════════════════════════════════════════════════════════════════════════
export function createApplicationStore({
	key,
	storage,
	subscribeToExternalChanges,
}: ApplicationStoreOptions) {
	const listeners = new Set<() => void>()
	let cachedRaw: string | null = null
	let cachedSnapshot = EMPTY

	const notify = () => {
		for (const listener of listeners) listener()
	}

	const getSnapshot = (): readonly Application[] => {
		const raw = storage.getItem(key)

		if (raw !== cachedRaw) {
			cachedRaw = raw
			cachedSnapshot = parseDocument(raw)
		}

		return cachedSnapshot
	}

	const write = (applications: readonly Application[]) => {
		storage.setItem(
			key,
			JSON.stringify({ applications, version: STORAGE_VERSION }),
		)
		notify()
	}

	return {
		get: (id: string): Application | undefined =>
			getSnapshot().find((application) => application.id === id),

		getSnapshot,

		remove(id: string): void {
			write(getSnapshot().filter((application) => application.id !== id))
		},

		save(application: Application): void {
			const others = getSnapshot().filter(({ id }) => id !== application.id)

			write(sortNewestFirst([application, ...others]))
		},

		subscribe(listener: () => void): () => void {
			listeners.add(listener)
			const unsubscribeExternal = subscribeToExternalChanges?.(listener)

			return () => {
				listeners.delete(listener)
				unsubscribeExternal?.()
			}
		},
	}
}

function parseDocument(raw: string | null): readonly Application[] {
	if (raw === null) return EMPTY

	let json: unknown

	try {
		json = JSON.parse(raw)
	} catch {
		console.warn('Stored applications are not valid JSON; ignoring them')
		return EMPTY
	}

	const document = storedDocumentSchema.safeParse(json)

	if (!document.success) {
		console.warn('Stored applications have an unknown format; ignoring them')
		return EMPTY
	}

	const applications = document.data.applications.flatMap((item) => {
		const parsed = applicationSchema.safeParse(item)

		return parsed.success ? [parsed.data] : []
	})

	return sortNewestFirst(applications)
}

function sortNewestFirst(
	applications: readonly Application[],
): readonly Application[] {
	return applications.toSorted((a, b) => b.createdAt - a.createdAt)
}
