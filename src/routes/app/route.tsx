import { auth } from '@clerk/tanstack-react-start/server'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { createIsomorphicFn } from '@tanstack/react-start'
import { AppShell } from '@/components/layout/app-shell'
import { WorkspaceScreen } from '@/screens/workspace/workspace-screen'

// ═══════════════════════════════════════════════════════════════════════════
//   Client navigations are not re-checked: every request authenticates
//   itself, and a 401 sends the user to sign in.
// ═══════════════════════════════════════════════════════════════════════════
const requireSignedIn = createIsomorphicFn()
	.server(async () => {
		const { userId } = await auth()

		if (!userId) throw redirect({ params: { _splat: '' }, to: '/sign-in/$' })
	})
	.client(() => {})

// ═══════════════════════════════════════════════════════════════════════════
//   Pages render only in the browser: they paint first from the query
//   cache persisted in localStorage.
// ═══════════════════════════════════════════════════════════════════════════
export const Route = createFileRoute('/app')({
	beforeLoad: () => requireSignedIn(),
	component: WorkspaceScreen,
	head: () => ({ meta: [{ content: 'noindex, nofollow', name: 'robots' }] }),
	pendingComponent: AppShell,
	ssr: 'data-only',
})
