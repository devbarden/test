import { SignIn } from '@clerk/tanstack-react-start'
import { auth } from '@clerk/tanstack-react-start/server'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { createIsomorphicFn } from '@tanstack/react-start'
import { Logo } from '@/components/brand'
import styles from './-sign-in.module.css'

const redirectIfSignedIn = createIsomorphicFn()
	.server(async () => {
		const { userId } = await auth()

		if (userId) throw redirect({ to: '/' })
	})
	.client(() => {})

// ═══════════════════════════════════════════════════════════════════════════
//   A splat route because Clerk drives its own sub-steps as real paths
//   (/sign-in/factor-one, /sign-in/sso-callback, …); anything narrower
//   turns the second step of an OAuth sign-in into a 404.
// ═══════════════════════════════════════════════════════════════════════════
export const Route = createFileRoute('/sign-in/$')({
	beforeLoad: () => redirectIfSignedIn(),
	component: SignInPage,
	head: () => ({ meta: [{ title: 'Sign in — Alt+Shift' }] }),
})

function SignInPage() {
	return (
		<main className={styles.page}>
			<Logo />
			<SignIn fallbackRedirectUrl="/" path="/sign-in" routing="path" />
		</main>
	)
}
