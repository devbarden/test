import type { ReactNode } from 'react'
import { Reveal } from '../../reveal/reveal'
import styles from './section-cards.module.css'

type SectionCardsProps = {
	as: 'ol' | 'ul'
	children: ReactNode
}

export function SectionCards({ as, children }: SectionCardsProps) {
	return (
		<Reveal as={as} className={styles.root} stagger>
			{children}
		</Reveal>
	)
}
