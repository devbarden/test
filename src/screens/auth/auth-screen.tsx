import { SignIn } from '@clerk/tanstack-react-start'
import { HomeLink } from '@/components/brand'
import { ClerkBoundary } from '@/components/clerk-boundary'
import { AuthPanel } from './auth-panel'
import styles from './auth-screen.module.css'
import { MeshBackground } from './mesh-background'

export function AuthScreen() {
	return (
		<ClerkBoundary>
			<div className={styles.root}>
				<main className={styles.formSide}>
					<MeshBackground />
					<div className={styles.topBar}>
						<HomeLink className={styles.mobileBrand} tone="inverse" />
					</div>
					<div className={styles.form}>
						<SignIn
							fallbackRedirectUrl="/app/applications"
							path="/sign-in"
							routing="path"
							signUpFallbackRedirectUrl="/app/applications"
							withSignUp
						/>
					</div>
				</main>
				<AuthPanel />
			</div>
		</ClerkBoundary>
	)
}
