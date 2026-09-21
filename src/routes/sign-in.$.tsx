import { auth } from '@clerk/tanstack-react-start/server'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { createIsomorphicFn } from '@tanstack/react-start'
import { pageTitle } from '@/lib/site'
import { m } from '@/paraglide/messages'
import { AuthScreen } from '@/screens/auth/auth-screen'

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
		meta: [
			{ title: pageTitle(m['meta.signIn.title']()) },
			{ content: 'noindex, nofollow', name: 'robots' },
		],
	}),
})
