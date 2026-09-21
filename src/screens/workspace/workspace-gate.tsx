import { useAuth } from '@clerk/tanstack-react-start'
import { Navigate } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/app-shell'
import { useClearCacheOnSignOut } from '@/lib/query/use-clear-cache-on-sign-out'
import { WorkspaceShell } from './workspace-shell'

// ═══════════════════════════════════════════════════════════════════════════
//   Keyed by user: a different account in the same tab gets its own query
//   client and persisted cache, never a frame of the previous user's
//   letters. A session that ends while the app is open — the user menu,
//   another tab, expiry — lands on sign-in.
// ═══════════════════════════════════════════════════════════════════════════
export function WorkspaceGate() {
	const { isLoaded, userId } = useAuth()

	useClearCacheOnSignOut()

	if (!isLoaded) return <AppShell />

	if (!userId) {
		return <Navigate params={{ _splat: '' }} replace to="/sign-in/$" />
	}

	return <WorkspaceShell key={userId} userId={userId} />
}
