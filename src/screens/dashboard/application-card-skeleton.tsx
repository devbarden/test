import clsx from 'clsx'
import { Panel } from '@/components/ui/panel'
import { Skeleton } from '@/components/ui/skeleton'
import styles from './application-card.module.css'

const PREVIEW_LINES = [
	'greeting',
	'one',
	'two',
	'three',
	'four',
	'five',
] as const

// ═══════════════════════════════════════════════════════════════════════════
//   A card with its text still on the way, built from the real card's own
//   classes: the same tile, the same preview box and the same action row.
//   The bars sit on the preview's line pitch, where lines of text will be —
//   a short greeting first, then a paragraph running into the same fade as
//   the letter's cut — and the actions keep their icon and label shapes, so
//   when the letter arrives the text fills in where the bars were and
//   nothing moves.
//
//   Seen while the first page loads on a fresh browser, and as the row
//   that stands in for the next page while the list scrolls.
// ═══════════════════════════════════════════════════════════════════════════
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
