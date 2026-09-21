import type { ReactNode } from 'react'
import { Heading } from '@/components/ui/heading'
import styles from './status-page.module.css'

type StatusPageProps = {
	action?: ReactNode
	description: string
	title: string
}

export function StatusPage({ action, description, title }: StatusPageProps) {
	return (
		<section className={styles.root}>
			<Heading as="h1" size="sm">
				{title}
			</Heading>
			<p className={styles.description}>{description}</p>
			{action}
		</section>
	)
}
