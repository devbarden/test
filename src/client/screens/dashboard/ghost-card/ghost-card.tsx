import clsx from 'clsx'
import styles from './ghost-card.module.css'

const LINES = ['heading', 'one', 'two', 'three', 'four', 'five'] as const

type GhostCardProps = {
	className?: string
}

export function GhostCard({ className }: GhostCardProps) {
	return (
		<div className={clsx(styles.root, className)}>
			{LINES.map((line) => (
				<span className={styles.line} key={line} />
			))}
		</div>
	)
}
