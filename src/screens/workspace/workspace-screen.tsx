import { ClerkBoundary } from '@/components/clerk-boundary'
import { WorkspaceGate } from './workspace-gate'

export function WorkspaceScreen() {
	return (
		<ClerkBoundary>
			<WorkspaceGate />
		</ClerkBoundary>
	)
}
