import { SignIn } from '@clerk/tanstack-react-start'
import { HomeLink } from '@/components/brand'
import { ClerkBoundary } from '@/components/clerk-boundary'
import { LanguageSwitcher } from '@/components/locale/language-switcher'
import { AuthPanel } from './auth-panel'
import styles from './auth-screen.module.css'
import { MeshBackground } from './mesh-background'

// ═══════════════════════════════════════════════════════════════════════════
//   One page for signing in and signing up. Clerk's <SignIn withSignUp>
//   decides which flow a visitor is in from what they type, so there is no
//   "Don't have an account?" detour and no second page to keep in sync.
//
//   The form sits on the brand's deep green with slow-moving light behind
//   it; the panel beside it (desktop only) says what the product is, for
//   the visitor who reached sign-in from a shared link and has never seen
//   the landing. The language switcher is here because this is a page a
//   visitor can land on first — and it re-localizes Clerk's own form.
// ═══════════════════════════════════════════════════════════════════════════
export function AuthScreen() {
	return (
		<ClerkBoundary>
			<div className={styles.root}>
				<main className={styles.formSide}>
					<MeshBackground />
					<div className={styles.topBar}>
						<HomeLink className={styles.mobileBrand} tone="inverse" />
						<LanguageSwitcher />
					</div>
					<div className={styles.form}>
						<SignIn
							fallbackRedirectUrl="/applications"
							path="/sign-in"
							routing="path"
							signUpFallbackRedirectUrl="/applications"
							withSignUp
						/>
					</div>
				</main>
				<AuthPanel />
			</div>
		</ClerkBoundary>
	)
}
