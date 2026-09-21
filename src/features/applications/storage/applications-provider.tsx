import { createContext, type ReactNode, use, useMemo } from 'react'
import {
	type ApplicationStore,
	createApplicationStore,
} from './application-store'
import { getBrowserStorage } from './browser-storage'
import { applicationsStorageKey } from './storage-key'

type ApplicationsContextValue = {
	persistent: boolean
	store: ApplicationStore
}

const ApplicationsContext = createContext<ApplicationsContextValue | null>(null)

type ApplicationsProviderProps = {
	children: ReactNode
	userId: string
}

// ═══════════════════════════════════════════════════════════════════════════
//   Rendered client-only (the authed layout opts out of SSR), so browser
//   storage can be read synchronously on the very first render: no empty
//   state flashes before the letters appear, and no hydration mismatch.
// ═══════════════════════════════════════════════════════════════════════════
export function ApplicationsProvider({
	children,
	userId,
}: ApplicationsProviderProps) {
	const value = useMemo(() => {
		const key = applicationsStorageKey(userId)
		const { persistent, storage, subscribeToExternalChanges } =
			getBrowserStorage(key)

		return {
			persistent,
			store: createApplicationStore({
				key,
				storage,
				subscribeToExternalChanges,
			}),
		}
	}, [userId])

	return <ApplicationsContext value={value}>{children}</ApplicationsContext>
}

export function useApplicationsContext(): ApplicationsContextValue {
	const context = use(ApplicationsContext)

	if (!context) {
		throw new Error(
			'useApplications* must be used inside <ApplicationsProvider>',
		)
	}

	return context
}
