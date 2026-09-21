import type { ReactNode } from 'react'
import { Reveal } from '../reveal'
import styles from './section.module.css'

type SectionCardsProps = {
	as: 'ol' | 'ul'
	children: ReactNode
}

export function SectionCards({ as, children }: SectionCardsProps) {
	return (
		<Reveal as={as} className={styles.cards} stagger>
			{children}
		</Reveal>
	)
}
