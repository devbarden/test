import clsx from 'clsx'
import type { ReactNode } from 'react'
import { Panel } from '@/components/ui/panel'
import styles from './section.module.css'

type SectionCardProps = {
	body: string
	icon: ReactNode
	marker?: ReactNode
	spacious?: boolean
	title: string
}

export function SectionCard({
	body,
	icon,
	marker,
	spacious = false,
	title,
}: SectionCardProps) {
	return (
		<Panel
			as="li"
			className={clsx(styles.card, spacious && styles.spacious)}
			interactive
			tone="raised"
		>
			<div className={styles.cardHead}>
				<span className={styles.iconChip}>{icon}</span>
				{marker}
			</div>
			<h3 className={styles.cardTitle}>{title}</h3>
			<p className={styles.cardBody}>{body}</p>
		</Panel>
	)
}
