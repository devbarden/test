import type { ReactNode } from 'react'
import { Container } from '@/client/kit/container'
import type { LandingSection } from '../../landing-sections'
import { SectionHeading } from '../section-heading'
import styles from './section.module.css'

type SectionProps = {
	children: ReactNode
	lead?: string
	section: LandingSection
	title: string
	tone?: 'plain' | 'ink'
}

// ═══════════════════════════════════════════════════════════════════════════
//   The section's nav label doubles as the kicker above its heading, so the
//   link and the chapter it jumps to always read the same.
// ═══════════════════════════════════════════════════════════════════════════
export function Section({ children, lead, section, title, tone = 'plain' }: SectionProps) {
	const content = (
		<>
			<SectionHeading kicker={section.label} lead={lead} onInk={tone === 'ink'} title={title} />
			{children}
		</>
	)

	return (
		<section className={styles.root} id={section.id}>
			<Container>{tone === 'ink' ? <div className={styles.ink}>{content}</div> : content}</Container>
		</section>
	)
}
