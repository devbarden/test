import clsx from 'clsx'
import type { ReactNode } from 'react'
import { Spinner } from '../spinner'
import styles from './button.module.css'

export type ButtonContentProps = {
	children: ReactNode
	iconEnd?: ReactNode
	iconStart?: ReactNode
	loading?: boolean
}

export function ButtonContent({ children, iconEnd, iconStart, loading = false }: ButtonContentProps) {
	return (
		<span className={styles.content}>
			<span className={clsx(styles.row, loading && styles.concealed)}>
				{iconStart}
				<span className={styles.label}>{children}</span>
				{iconEnd}
			</span>
			{loading && <Spinner />}
		</span>
	)
}
