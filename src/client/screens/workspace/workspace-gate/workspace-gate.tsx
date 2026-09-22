import { useAuth } from '@clerk/tanstack-react-start'
import { Navigate } from '@tanstack/react-router'
import { RouteColdStart } from '@/client/components/route-cold-start'
import { useClearCacheOnSignOut } from '@/client/lib/query/use-clear-cache-on-sign-out'
import { WorkspaceShell } from '../workspace-shell'

// ═══════════════════════════════════════════════════════════════════════════
//   Keyed by user: another account never sees a frame of the previous user's
//   letters.
// ═══════════════════════════════════════════════════════════════════════════
export function WorkspaceGate() {
	const { isLoaded, userId } = useAuth()

	useClearCacheOnSignOut()

	if (!isLoaded) return <RouteColdStart />

	if (!userId) {
		return <Navigate params={{ _splat: '' }} replace to="/sign-in/$" />
	}

	return <WorkspaceShell key={userId} userId={userId} />
}
