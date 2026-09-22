import clsx from 'clsx'
import type { ReactNode } from 'react'
import styles from './badge.module.css'

type BadgeProps = {
	children: ReactNode
	className?: string
	icon?: ReactNode
}

export function Badge({ children, className, icon }: BadgeProps) {
	return (
		<span className={clsx(styles.root, className)}>
			{icon}
			{children}
		</span>
	)
}
