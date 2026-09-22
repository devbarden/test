import clsx from 'clsx'
import { Panel } from '@/client/kit/panel'
import { Skeleton } from '@/client/kit/skeleton'
import styles from './application-card.module.css'

export type ApplicationCardSkeletonVariant = 'first' | 'second'

type ApplicationCardSkeletonProps = {
	variant?: ApplicationCardSkeletonVariant
}

const PREVIEW_LINES = ['greeting', 'one', 'two', 'three', 'four', 'five'] as const

const VARIANT_CLASS = {
	first: undefined,
	second: styles.skeletonSecond,
} satisfies Record<ApplicationCardSkeletonVariant, string | undefined>

// ═══════════════════════════════════════════════════════════════════════════
//   The same Panel, preview and actions as the card, so it takes the same
//   space and fades the same way. Two line patterns, because two identical
//   placeholders side by side read as a pattern, not as two letters.
// ═══════════════════════════════════════════════════════════════════════════
export function ApplicationCardSkeleton({ variant = 'first' }: ApplicationCardSkeletonProps) {
	return (
		<Panel aria-hidden="true" className={clsx(styles.root, VARIANT_CLASS[variant])}>
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
