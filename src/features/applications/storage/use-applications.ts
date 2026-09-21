import { useSyncExternalStore } from 'react'
import type { Application } from '../model/application'
import { useApplicationsContext } from './applications-provider'

export function useApplications(): readonly Application[] {
	const { store } = useApplicationsContext()

	return useSyncExternalStore(store.subscribe, store.getSnapshot)
}

export function useApplication(id: string): Application | undefined {
	return useApplications().find((application) => application.id === id)
}

export function useApplicationStore() {
	return useApplicationsContext().store
}

export function useIsStoragePersistent(): boolean {
	return useApplicationsContext().persistent
}
