import { Eyebrow } from '@/components/ui/eyebrow'
import { Heading } from '@/components/ui/heading'
import { Reveal } from '../reveal/reveal'
import styles from './section.module.css'

type SectionHeadingProps = {
	kicker: string
	lead?: string
	title: string
}

export function SectionHeading({ kicker, lead, title }: SectionHeadingProps) {
	return (
		<Reveal className={styles.heading} stagger>
			<Eyebrow className={styles.kicker}>{kicker}</Eyebrow>
			<Heading size="lg">{title}</Heading>
			{lead && <p className={styles.lead}>{lead}</p>}
		</Reveal>
	)
}
