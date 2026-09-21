import type { KeyValueStorage } from './application-store'

export type BrowserStorage = {
	persistent: boolean
	storage: KeyValueStorage
	subscribeToExternalChanges: (onChange: () => void) => () => void
}

// ═══════════════════════════════════════════════════════════════════════════
//   localStorage can be missing or throw on access — Safari with "Block all
//   cookies", some embedded webviews, a sandboxed iframe. The app must still
//   work there, so it falls back to memory and says so (`persistent: false`)
//   instead of crashing: the user can generate and copy letters, they just
//   will not survive the tab. The probe write also catches a storage that
//   exists but is full or read-only.
// ═══════════════════════════════════════════════════════════════════════════
export function getBrowserStorage(key: string): BrowserStorage {
	try {
		const probe = `${key}:probe`

		window.localStorage.setItem(probe, probe)
		window.localStorage.removeItem(probe)

		return {
			persistent: true,
			storage: window.localStorage,
			subscribeToExternalChanges: (onChange) => {
				const handleStorage = (event: StorageEvent) => {
					if (event.key === key || event.key === null) onChange()
				}

				window.addEventListener('storage', handleStorage)

				return () => window.removeEventListener('storage', handleStorage)
			},
		}
	} catch {
		return {
			persistent: false,
			storage: createMemoryStorage(),
			subscribeToExternalChanges: () => () => {},
		}
	}
}

export function createMemoryStorage(): KeyValueStorage {
	const values = new Map<string, string>()

	return {
		getItem: (key) => values.get(key) ?? null,
		setItem: (key, value) => {
			values.set(key, value)
		},
	}
}
