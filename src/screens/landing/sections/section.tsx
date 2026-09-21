import type { ReactNode } from 'react'
import { Container } from '@/components/layout/container'
import styles from './section.module.css'
import { SectionHeading } from './section-heading'

type SectionProps = {
	children: ReactNode
	id: string
	kicker: string
	lead?: string
	title: string
	tone?: 'plain' | 'ink'
}

export function Section({
	children,
	id,
	kicker,
	lead,
	title,
	tone = 'plain',
}: SectionProps) {
	const content = (
		<>
			<SectionHeading kicker={kicker} lead={lead} title={title} />
			{children}
		</>
	)

	return (
		<section className={styles.root} id={id}>
			<Container>
				{tone === 'ink' ? <div className={styles.ink}>{content}</div> : content}
			</Container>
		</section>
	)
}
