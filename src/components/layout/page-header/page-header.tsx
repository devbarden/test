import clsx from 'clsx'
import type { ReactNode } from 'react'
import { Heading } from '@/components/ui/heading'
import styles from './page-header.module.css'

type PageHeaderProps = {
	actions?: ReactNode
	size?: 'md' | 'lg'
	title: string
	tone?: 'default' | 'muted'
}

// ═══════════════════════════════════════════════════════════════════════════
//   The muted tone is the mockup's "New application": a heading standing in
//   until the user has typed enough for the real one.
// ═══════════════════════════════════════════════════════════════════════════
export function PageHeader({
	actions,
	size = 'lg',
	title,
	tone = 'default',
}: PageHeaderProps) {
	return (
		<div className={clsx(styles.root, size === 'md' && styles.md)}>
			<Heading as="h1" size={size} tone={tone}>
				{title}
			</Heading>
			{actions && <div className={styles.actions}>{actions}</div>}
		</div>
	)
}
