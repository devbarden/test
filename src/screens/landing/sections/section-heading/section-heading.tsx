import clsx from 'clsx'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Heading } from '@/components/ui/heading'
import { Reveal } from '../../reveal/reveal'
import styles from './section-heading.module.css'

type SectionHeadingProps = {
	kicker: string
	lead?: string
	onInk?: boolean
	title: string
}

export function SectionHeading({ kicker, lead, onInk = false, title }: SectionHeadingProps) {
	return (
		<Reveal className={clsx(styles.root, onInk && styles.onInk)} stagger>
			<Eyebrow className={styles.kicker}>{kicker}</Eyebrow>
			<Heading size="lg">{title}</Heading>
			{lead && <p className={styles.lead}>{lead}</p>}
		</Reveal>
	)
}
