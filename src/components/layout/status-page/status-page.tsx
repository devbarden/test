import type { ReactNode } from 'react'
import styles from './status-page.module.css'

type StatusPageProps = {
	action?: ReactNode
	description: string
	title: string
}

export function StatusPage({ action, description, title }: StatusPageProps) {
	return (
		<section className={styles.status}>
			<h1 className={styles.title}>{title}</h1>
			<p className={styles.description}>{description}</p>
			{action}
		</section>
	)
}
