import { SparklesIcon } from 'lucide-react'
import { Container } from '@/components/layout/container'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { Reveal } from '../reveal'
import styles from './hero.module.css'

export function Hero() {
	return (
		<section className={styles.root}>
			<Container>
				<Reveal className={styles.copy} immediate stagger>
					<Badge icon={<SparklesIcon />}>Cover letters, written for you</Badge>
					<Heading as="h1" className={styles.title} size="xl">
						A personal cover letter for every job, in seconds
					</Heading>
					<p className={styles.lead}>
						Tell Alt+Shift the role, the company and what you are good at. It
						writes the letter while you watch — from your facts only, ready to
						copy and send.
					</p>
					<div className={styles.actions}>
						<ButtonLink shape="pill" size="lg" to="/app/applications">
							Write my first letter
						</ButtonLink>
					</div>
					<p className={styles.note}>Free to start. No templates to fill in.</p>
				</Reveal>
			</Container>
		</section>
	)
}
