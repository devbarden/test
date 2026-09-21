import { Panel } from '@/components/ui/panel'
import styles from './application-card.module.css'

// ═══════════════════════════════════════════════════════════════════════════
//   Only ever seen on a first visit from a fresh browser: after that the
//   dashboard renders from the persisted cache and revalidates silently.
// ═══════════════════════════════════════════════════════════════════════════
export function ApplicationCardSkeleton() {
	return (
		<Panel aria-hidden="true" className={styles.card}>
			<div className={styles.skeleton}>
				<span className={styles.skeletonLine} />
				<span className={styles.skeletonLine} />
				<span className={styles.skeletonLine} />
				<span className={styles.skeletonLine} />
			</div>
		</Panel>
	)
}
