import { PlusIcon } from 'lucide-react'
import { PRODUCT_FAQ } from '@/client/features/marketing/ui/product-content'
import { Panel } from '@/client/kit/panel'
import { LANDING_SECTIONS } from '../../landing-sections'
import { Reveal } from '../../reveal'
import { Section } from '../section'
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
