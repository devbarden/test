import { PlusIcon } from 'lucide-react'
import { Panel } from '@/components/ui/panel'
import { PRODUCT_FAQ } from '@/features/marketing/ui/product-content'
import { LANDING_SECTIONS } from '../../landing-sections'
import { Reveal } from '../../reveal/reveal'
import { Section } from '../section/section'
import styles from './faq.module.css'

export function Faq() {
	return (
		<Section section={LANDING_SECTIONS.faq} title="Straight answers" tone="ink">
			<Reveal className={styles.list}>
				<Panel tone="raised">
					{PRODUCT_FAQ.map((entry) => (
						<details className={styles.item} key={entry.id} name="faq">
							<summary className={styles.question}>
								{entry.question}
								<PlusIcon className={styles.icon} />
							</summary>
							<p className={styles.answer}>{entry.answer}</p>
						</details>
					))}
				</Panel>
			</Reveal>
		</Section>
	)
}
