import { Logo } from '@/components/brand'
import styles from './route-cold-start.module.css'

// ═══════════════════════════════════════════════════════════════════════════
//   Only while the app boots with no shell to keep; a spinner over an empty
//   shell reads as a hang, a pulsing brand reads as a start.
// ═══════════════════════════════════════════════════════════════════════════
export function RouteColdStart() {
	return (
		<div aria-busy="true" className={styles.root}>
			<Logo animated />
		</div>
	)
}
