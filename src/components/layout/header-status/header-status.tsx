import clsx from 'clsx'
import type { ReactNode } from 'react'
import styles from './header-status.module.css'

type HeaderStatusProps = {
	hideOnPhone?: boolean
	indicator?: ReactNode
	suffix?: string
	value?: string
}

export function HeaderStatus({
	hideOnPhone = false,
	indicator,
	suffix,
	value,
}: HeaderStatusProps) {
	const className = clsx(styles.root, hideOnPhone && styles.hideOnPhone)

	if (value === undefined)
		return <div aria-hidden="true" className={className} />

	return (
		<div className={className}>
			<span aria-hidden="true" className={styles.label}>
				{value}
				{suffix && <span className={styles.suffix}>{suffix}</span>}
			</span>
			{indicator}
		</div>
	)
}
