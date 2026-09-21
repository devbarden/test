import { PlusIcon } from 'lucide-react'
import { Container } from '@/components/layout/container'
import { Panel } from '@/components/ui/panel'
import { PRODUCT_FAQ } from '@/features/marketing/model/product-content'
import { m } from '@/paraglide/messages'
import { LANDING_SECTIONS } from '../landing-sections'
import { Reveal } from '../reveal/reveal'
import styles from './faq.module.css'
import section from './section.module.css'
import { SectionHeading } from './section-heading'

// ═══════════════════════════════════════════════════════════════════════════
//   Native <details>, no accordion library: the answers are in the HTML
//   whether or not a panel is open, so a crawler and find-in-page read every
//   one, and the open/close animation is CSS alone (see faq.module.css).
// ═══════════════════════════════════════════════════════════════════════════
export function Faq() {
	return (
		<section className={section.section} id={LANDING_SECTIONS.faq.id}>
			<Container>
				<div className={section.ink}>
					<SectionHeading
						kicker={m['landing.faq.kicker']()}
						title={m['landing.faq.title']()}
					/>
					<Reveal className={styles.list}>
						<Panel tone="raised">
							{PRODUCT_FAQ.map((entry) => (
								<details className={styles.item} key={entry.id} name="faq">
									<summary className={styles.question}>
										{entry.question()}
										<PlusIcon className={styles.icon} />
									</summary>
									<p className={styles.answer}>{entry.answer()}</p>
								</details>
							))}
						</Panel>
					</Reveal>
				</div>
			</Container>
		</section>
	)
}
