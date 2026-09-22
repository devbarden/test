import clsx from 'clsx'
import styles from './skeleton.module.css'

type SkeletonShape = 'block' | 'line'

type SkeletonProps = {
	className?: string
	shape?: SkeletonShape
}

const SHAPE_CLASS = {
	block: styles.block,
	line: styles.line,
} satisfies Record<SkeletonShape, string | undefined>

export function Skeleton({ className, shape = 'line' }: SkeletonProps) {
	return <span aria-hidden="true" className={clsx(styles.root, SHAPE_CLASS[shape], className)} />
}
