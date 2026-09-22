import { ClerkBoundary } from '@/client/components/clerk-boundary'
import { WorkspaceGate } from '../workspace-gate'

export function WorkspaceScreen() {
	return (
		<ClerkBoundary>
			<WorkspaceGate />
		</ClerkBoundary>
	)
}
