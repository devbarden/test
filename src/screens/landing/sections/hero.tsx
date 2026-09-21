import { SparklesIcon } from 'lucide-react'
import { Container } from '@/components/layout/container'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { m } from '@/paraglide/messages'
import { Reveal } from '../reveal/reveal'
import styles from './hero.module.css'

export function Hero() {
	return (
		<section className={styles.hero}>
			<Container>
				<Reveal className={styles.copy} immediate stagger>
					<Badge icon={<SparklesIcon />}>{m['landing.hero.kicker']()}</Badge>
					<Heading as="h1" className={styles.title} size="xl">
						{m['landing.hero.title']()}
					</Heading>
					<p className={styles.lead}>{m['landing.hero.lead']()}</p>
					<div className={styles.actions}>
						<ButtonLink shape="pill" size="lg" to="/applications">
							{m['landing.cta.primary']()}
						</ButtonLink>
					</div>
					<p className={styles.note}>{m['landing.hero.note']()}</p>
				</Reveal>
			</Container>
		</section>
	)
}
