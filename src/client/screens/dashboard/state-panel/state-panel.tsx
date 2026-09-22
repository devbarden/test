import type { ReactNode } from 'react'
import { Heading } from '@/client/kit/heading'
import { Panel } from '@/client/kit/panel'
import styles from './state-panel.module.css'

type StatePanelProps = {
	action?: ReactNode
	description: string
	illustration: ReactNode
	role?: 'status'
	title: string
}

export function StatePanel({ action, description, illustration, role, title }: StatePanelProps) {
	return (
		<Panel className={styles.root} role={role}>
			<div aria-hidden="true" className={styles.illustration}>
				{illustration}
			</div>
			<Heading className={styles.title} size="sm">
				{title}
			</Heading>
			<p className={styles.description}>{description}</p>
			{action && <div className={styles.action}>{action}</div>}
		</Panel>
	)
}
