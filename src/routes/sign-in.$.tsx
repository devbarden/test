import { auth } from '@clerk/tanstack-react-start/server'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { createIsomorphicFn } from '@tanstack/react-start'
import { pageTitle } from '@/client/lib/document/brand'
import { AuthScreen } from '@/client/screens/auth/auth-screen'

const redirectIfSignedIn = createIsomorphicFn()
	.server(async () => {
		const { userId } = await auth()

		if (userId) throw redirect({ to: '/app/applications' })
	})
	.client(() => {})

export const Route = createFileRoute('/sign-in/$')({
	beforeLoad: () => redirectIfSignedIn(),
	component: AuthScreen,
	head: () => ({
		meta: [{ title: pageTitle('Sign in') }],
	}),
})
