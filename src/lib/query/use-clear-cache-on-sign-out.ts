import { useAuth } from '@clerk/tanstack-react-start'
import { useEffect } from 'react'
import { disposeUserQueryClient } from './user-query-client'

// ═══════════════════════════════════════════════════════════════════════════
//   By state, not by the sign-out event: a session ended while no /app tab
//   was open must not leave its letters in this browser.
// ═══════════════════════════════════════════════════════════════════════════
export function useClearCacheOnSignOut() {
	const { isLoaded, isSignedIn } = useAuth()

	useEffect(() => {
		if (isLoaded && !isSignedIn) disposeUserQueryClient()
	}, [isLoaded, isSignedIn])
}
