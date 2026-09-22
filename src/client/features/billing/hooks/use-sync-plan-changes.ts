import { useEffect, useEffectEvent, useRef } from 'react'
import { useEntitlements } from './use-entitlements'

export function useSyncPlanChanges(onChange: () => void): void {
	const { entitlements, isLoaded } = useEntitlements()
	const key = JSON.stringify(entitlements)
	const previousKey = useRef(key)
	const notify = useEffectEvent(onChange)

	useEffect(() => {
		if (!isLoaded || previousKey.current === key) return

		previousKey.current = key
		notify()
	}, [isLoaded, key])
}
