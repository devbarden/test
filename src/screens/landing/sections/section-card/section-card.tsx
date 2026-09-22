import clsx from 'clsx'
import type { ReactNode } from 'react'
import { Panel } from '@/components/ui/panel'
import styles from './section-card.module.css'

type SectionCardProps = {
	body: string
	icon: ReactNode
	marker?: ReactNode
	spacious?: boolean
	title: string
}

export function SectionCard({ body, icon, marker, spacious = false, title }: SectionCardProps) {
	return (
		<Panel as="li" className={clsx(styles.root, spacious && styles.spacious)} interactive tone="raised">
			<div className={styles.head}>
				<span className={styles.iconChip}>{icon}</span>
				{marker}
			</div>
			<h3 className={styles.title}>{title}</h3>
			<p className={styles.body}>{body}</p>
		</Panel>
	)
}
