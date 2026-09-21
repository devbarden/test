import { ClerkBoundary } from '@/components/clerk-boundary'
import { WorkspaceGate } from './workspace-gate'

// ═══════════════════════════════════════════════════════════════════════════
//   The signed-in part of the product: Clerk around it, then the gate that
//   decides between a loading shell, a trip to sign-in and the workspace.
// ═══════════════════════════════════════════════════════════════════════════
export function WorkspaceScreen() {
	return (
		<ClerkBoundary>
			<WorkspaceGate />
		</ClerkBoundary>
	)
}
