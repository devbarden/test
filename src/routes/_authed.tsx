import { auth } from '@clerk/tanstack-react-start/server'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { createIsomorphicFn } from '@tanstack/react-start'
import { AppShell } from '@/components/layout/app-shell'
import { WorkspaceScreen } from '@/screens/workspace/workspace-screen'

// ═══════════════════════════════════════════════════════════════════════════
//   Two guards for two moments:
//
//   - A document request is checked on the server, before anything renders,
//     so a signed-out visitor is redirected without ever seeing the app.
//   - Client-side navigations are NOT re-checked with a round trip: every
//     server function and /api/generate authenticates each request itself,
//     and a 401 from any of them sends the user to sign in (see
//     lib/query/query-client.ts). Signing out while the app is open is
//     caught by the workspace gate.
// ═══════════════════════════════════════════════════════════════════════════
const requireSignedIn = createIsomorphicFn()
	.server(async () => {
		const { userId } = await auth()

		if (!userId) throw redirect({ params: { _splat: '' }, to: '/sign-in/$' })
	})
	.client(() => {})

// ═══════════════════════════════════════════════════════════════════════════
//   `data-only`: the guard above still runs on the server, but the pages
//   render in the browser only. They are first painted from the query cache
//   persisted in localStorage — which a server cannot see — and then
//   revalidated against the API.
// ═══════════════════════════════════════════════════════════════════════════
export const Route = createFileRoute('/_authed')({
	beforeLoad: () => requireSignedIn(),
	component: WorkspaceScreen,
	head: () => ({ meta: [{ content: 'noindex, nofollow', name: 'robots' }] }),
	pendingComponent: AppShell,
	ssr: 'data-only',
})
