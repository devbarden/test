import { useEffect, useEffectEvent, useRef } from 'react'
import { useEntitlements } from './use-entitlements'

// ═══════════════════════════════════════════════════════════════════════════
//   After checkout (or a cancellation, or a renewal that failed) Clerk
//   issues a session token with new entitlements. The moment the browser
//   sees them, `onChange` runs so the caller can refetch whatever its limits
//   came from. Keyed on the entitlements themselves, not the plan name: a
//   feature granted or withdrawn without a plan change counts too.
//
//   The caller decides what to refetch, so billing never has to know which
//   other features read the limits it decides.
// ═══════════════════════════════════════════════════════════════════════════
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
