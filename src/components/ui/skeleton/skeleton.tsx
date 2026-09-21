import clsx from 'clsx'
import styles from './skeleton.module.css'

type SkeletonProps = {
	className?: string
	shape?: 'block' | 'line'
}

export function Skeleton({ className, shape = 'line' }: SkeletonProps) {
	return (
		<span
			aria-hidden="true"
			className={clsx(styles.skeleton, styles[shape], className)}
		/>
	)
}
