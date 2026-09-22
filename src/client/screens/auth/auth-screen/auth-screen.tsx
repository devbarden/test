import { ClerkBoundary } from '@/client/components/clerk-boundary'
import { HomeLink } from '@/client/components/home-link'
import { AuthPanel } from '../auth-panel'
import { MeshBackground } from '../mesh-background'
import { SignInForm } from '../sign-in-form'
import styles from './auth-screen.module.css'

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
