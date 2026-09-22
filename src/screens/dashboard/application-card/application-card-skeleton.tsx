import clsx from 'clsx'
import { Panel } from '@/components/ui/panel'
import { Skeleton } from '@/components/ui/skeleton'
import styles from './application-card.module.css'

const PREVIEW_LINES = ['greeting', 'one', 'two', 'three', 'four', 'five'] as const

export function ApplicationCardSkeleton() {
	return (
		<Panel aria-hidden="true" className={styles.root}>
			<div className={clsx(styles.preview, styles.skeletonPreview)}>
				{PREVIEW_LINES.map((line) => (
					<Skeleton className={styles.skeletonLine} key={line} />
				))}
			</div>
			<div className={styles.actions}>
				<span className={styles.skeletonAction}>
					<Skeleton className={styles.skeletonIcon} shape="block" />
					<Skeleton className={styles.skeletonDelete} />
				</span>
				<span className={styles.skeletonAction}>
					<Skeleton className={styles.skeletonCopy} />
					<Skeleton className={styles.skeletonIcon} shape="block" />
				</span>
			</div>
		</Panel>
	)
}
