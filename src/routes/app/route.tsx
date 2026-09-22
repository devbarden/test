import { auth } from '@clerk/tanstack-react-start/server'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { createIsomorphicFn } from '@tanstack/react-start'
import { RouteColdStart } from '@/client/components/route-cold-start'
import { WorkspaceScreen } from '@/client/screens/workspace/workspace-screen'

const requireSignedIn = createIsomorphicFn()
	.server(async () => {
		const { userId } = await auth()

		if (!userId) throw redirect({ params: { _splat: '' }, to: '/sign-in/$' })
	})
	.client(() => {})

export const Route = createFileRoute('/app')({
	beforeLoad: () => requireSignedIn(),
	component: WorkspaceScreen,
	pendingComponent: RouteColdStart,
	ssr: 'data-only',
})
