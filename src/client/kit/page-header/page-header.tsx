import clsx from 'clsx'
import type { ReactNode } from 'react'
import { Heading } from '@/client/kit/heading'
import styles from './page-header.module.css'

type PageHeaderSize = 'md' | 'lg'

type PageHeaderProps = {
	actions?: ReactNode
	size?: PageHeaderSize
	title: string
	tone?: 'default' | 'muted'
}

const SIZE_CLASS = {
	lg: undefined,
	md: styles.md,
} satisfies Record<PageHeaderSize, string | undefined>

export function PageHeader({ actions, size = 'lg', title, tone = 'default' }: PageHeaderProps) {
	return (
		<div className={clsx(styles.root, SIZE_CLASS[size])}>
			<Heading as="h1" size={size} tone={tone}>
				{title}
			</Heading>
			{actions && <div className={styles.actions}>{actions}</div>}
		</div>
	)
}
