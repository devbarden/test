import { Panel } from '@/components/ui/panel'
import styles from './empty-state.module.css'

// ═══════════════════════════════════════════════════════════════════════════
//   No call to action of its own: the goal banner right below it carries
//   "Create New", and so does the page header. A third identical button
//   would only compete with them. This block's job is to show what WILL be
//   here — the ghost cards are the shape of a letter card — and to lower
//   the bar to starting.
// ═══════════════════════════════════════════════════════════════════════════
export function EmptyState() {
	return (
		<Panel className={styles.emptyState}>
			<div aria-hidden="true" className={styles.illustration}>
				<div className={styles.ghostCard}>
					<span className={styles.ghostLine} />
					<span className={styles.ghostLine} />
					<span className={styles.ghostLine} />
				</div>
				<div className={styles.ghostCard}>
					<span className={styles.ghostLine} />
					<span className={styles.ghostLine} />
					<span className={styles.ghostLine} />
				</div>
			</div>
			<h2 className={styles.title}>No applications yet</h2>
			<p className={styles.description}>
				Tell us about the role and what you are good at — the first draft of
				your cover letter will be ready in seconds.
			</p>
		</Panel>
	)
}
