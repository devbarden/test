import { Panel } from '@/components/ui/panel'
import { Skeleton } from '@/components/ui/skeleton'
import styles from './application-card.module.css'

// ═══════════════════════════════════════════════════════════════════════════
//   Only ever seen on a first visit from a fresh browser: after that the
//   dashboard renders from the persisted cache and revalidates silently.
// ═══════════════════════════════════════════════════════════════════════════
export function ApplicationCardSkeleton() {
	return (
		<Panel aria-hidden="true" className={styles.root}>
			<div className={styles.skeleton}>
				<Skeleton className={styles.shortLine} />
				<Skeleton />
				<Skeleton />
				<Skeleton className={styles.lastLine} />
			</div>
		</Panel>
	)
}
