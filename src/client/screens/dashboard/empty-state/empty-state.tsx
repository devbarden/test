import { GhostCard } from '../ghost-card'
import { StatePanel } from '../state-panel'
import styles from './empty-state.module.css'

export function EmptyState() {
	return (
		<StatePanel
			description="Tell us about the role and what you are good at — the first draft of your cover letter will be ready in seconds."
			illustration={
				<>
					<GhostCard className={styles.back} />
					<GhostCard className={styles.front} />
				</>
			}
			title="No applications yet"
		/>
	)
}
