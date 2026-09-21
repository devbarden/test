import { UserButton, useAuth } from '@clerk/tanstack-react-start'
import { auth } from '@clerk/tanstack-react-start/server'
import {
	createFileRoute,
	Navigate,
	Outlet,
	redirect,
} from '@tanstack/react-router'
import { createIsomorphicFn } from '@tanstack/react-start'
import type { ReactNode } from 'react'
import { AppHeader } from '@/components/layout/app-header'
import { Container } from '@/components/layout/page'
import { ToastProvider } from '@/components/ui/toast'
import { ApplicationsProvider } from '@/features/applications'
import { GoalIndicator } from '@/features/goal'

// ═══════════════════════════════════════════════════════════════════════════
//   Two guards for two moments:
//
//   - A document request is checked on the server, before anything renders,
//     so a signed-out visitor is redirected without ever seeing the app.
//   - Client-side navigations are NOT re-checked with a round trip: every
//     page here reads browser storage, and the one thing that talks to the
//     server — /api/generate — authenticates each request itself. Signing
//     out while the app is open is caught by `useAuth` in the layout.
// ═══════════════════════════════════════════════════════════════════════════
const requireSignedIn = createIsomorphicFn()
	.server(async () => {
		const { userId } = await auth()

		if (!userId) throw redirect({ params: { _splat: '' }, to: '/sign-in/$' })
	})
	.client(() => {})

// ═══════════════════════════════════════════════════════════════════════════
//   `data-only`: the guard above still runs on the server, but the pages
//   render in the browser only. They are built entirely from localStorage,
//   which a server cannot see — rendering them there would produce an empty
//   dashboard and then swap it for the real one on hydration.
// ═══════════════════════════════════════════════════════════════════════════
export const Route = createFileRoute('/_authed')({
	beforeLoad: () => requireSignedIn(),
	component: AuthedLayout,
	pendingComponent: ShellFallback,
	ssr: 'data-only',
})

function AuthedLayout() {
	const { isLoaded, userId } = useAuth()

	if (!isLoaded) return <ShellFallback />

	if (!userId)
		return <Navigate params={{ _splat: '' }} replace to="/sign-in/$" />

	return (
		<ApplicationsProvider userId={userId}>
			<ToastProvider>
				<Shell account={<UserButton />} status={<GoalIndicator />}>
					<Outlet />
				</Shell>
			</ToastProvider>
		</ApplicationsProvider>
	)
}

function ShellFallback() {
	return <Shell />
}

type ShellProps = {
	account?: ReactNode
	children?: ReactNode
	status?: ReactNode
}

function Shell({ account, children, status }: ShellProps) {
	return (
		<Container>
			<AppHeader account={account} status={status} />
			<main>{children}</main>
		</Container>
	)
}
