import clsx from 'clsx'
import type { ReactNode } from 'react'
import styles from './page.module.css'

type ContainerProps = {
	children: ReactNode
}

export function Container({ children }: ContainerProps) {
	return <div className={styles.container}>{children}</div>
}

type PageHeaderProps = {
	actions?: ReactNode
	placeholder?: boolean
	size?: 'md' | 'lg'
	title: string
}

// ═══════════════════════════════════════════════════════════════════════════
//   `placeholder` renders the title in the muted tone the mockup uses for
//   "New application" — a heading that is standing in until the user has
//   typed enough for the real one.
// ═══════════════════════════════════════════════════════════════════════════
export function PageHeader({
	actions,
	placeholder = false,
	size = 'lg',
	title,
}: PageHeaderProps) {
	return (
		<div className={styles.pageHeader}>
			<h1
				className={clsx(
					styles.title,
					styles[size],
					placeholder && styles.placeholder,
				)}
			>
				{title}
			</h1>
			{actions && <div className={styles.actions}>{actions}</div>}
		</div>
	)
}
