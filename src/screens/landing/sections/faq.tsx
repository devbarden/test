import { PlusIcon } from 'lucide-react'
import { Panel } from '@/components/ui/panel'
import { PRODUCT_FAQ } from '@/features/marketing/model/product-content'
import { m } from '@/paraglide/messages'
import { LANDING_SECTIONS } from '../landing-sections'
import { Reveal } from '../reveal/reveal'
import styles from './faq.module.css'
import { Section } from './section'

export function Faq() {
	return (
		<Section
			id={LANDING_SECTIONS.faq.id}
			kicker={m['landing.faq.kicker']()}
			title={m['landing.faq.title']()}
			tone="ink"
		>
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
		</Section>
	)
}
