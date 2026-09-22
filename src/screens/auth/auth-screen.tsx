import { HomeLink } from '@/components/brand'
import { ClerkBoundary } from '@/components/clerk-boundary'
import { AuthPanel } from './auth-panel/auth-panel'
import styles from './auth-screen.module.css'
import { MeshBackground } from './mesh-background/mesh-background'
import { SignInForm } from './sign-in-form/sign-in-form'

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
						<SignInForm />
					</div>
				</main>
				<AuthPanel />
			</div>
		</ClerkBoundary>
	)
}
