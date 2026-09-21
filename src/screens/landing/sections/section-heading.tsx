import { Eyebrow } from '@/components/ui/eyebrow'
import { Heading } from '@/components/ui/heading'
import { Reveal } from '../reveal/reveal'
import section from './section.module.css'

type SectionHeadingProps = {
	kicker: string
	lead?: string
	title: string
}

export function SectionHeading({ kicker, lead, title }: SectionHeadingProps) {
	return (
		<Reveal className={section.heading} stagger>
			<Eyebrow className={section.kicker}>{kicker}</Eyebrow>
			<Heading size="lg">{title}</Heading>
			{lead && <p className={section.lead}>{lead}</p>}
		</Reveal>
	)
}
