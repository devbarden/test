import { useClerk } from '@clerk/tanstack-react-start'
import { useEffect } from 'react'
import { clearPersistedCaches } from '@/lib/query-persistence'

// ═══════════════════════════════════════════════════════════════════════════
//   Clerk reports the session going away however it happens — the user
//   menu, another tab, an expired or revoked session — and each of them
//   wipes the letters cached in this browser.
// ═══════════════════════════════════════════════════════════════════════════
export function useClearCacheOnSignOut() {
	const clerk = useClerk()

	useEffect(
		() =>
			clerk.addListener(({ user }) => {
				if (user === null) clearPersistedCaches()
			}),
		[clerk],
	)
}
