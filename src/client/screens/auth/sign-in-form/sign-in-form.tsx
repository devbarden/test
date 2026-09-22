import { SignIn } from '@clerk/tanstack-react-start'
import { useClearCacheOnSignOut } from '@/client/lib/query/use-clear-cache-on-sign-out'

export function SignInForm() {
	useClearCacheOnSignOut()

	return (
		<SignIn
			fallbackRedirectUrl="/app/applications"
			path="/sign-in"
			routing="path"
			signUpFallbackRedirectUrl="/app/applications"
			withSignUp
		/>
	)
}
