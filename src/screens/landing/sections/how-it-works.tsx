import { PRODUCT_STEPS } from '@/features/marketing/model/product-content'
import { PRODUCT_STEP_ICONS } from '@/features/marketing/ui/product-icons'
import { m } from '@/paraglide/messages'
import { LANDING_SECTIONS } from '../landing-sections'
import styles from './how-it-works.module.css'
import { Section } from './section'
import { SectionCard } from './section-card'
import { SectionCards } from './section-cards'

export function HowItWorks() {
	return (
		<Section
			id={LANDING_SECTIONS.howItWorks.id}
			kicker={m['landing.steps.kicker']()}
			lead={m['landing.steps.lead']()}
			title={m['landing.steps.title']()}
			tone="ink"
		>
			<SectionCards as="ol">
				{PRODUCT_STEPS.map((step, index) => {
					const Icon = PRODUCT_STEP_ICONS[step.id]

					return (
						<SectionCard
							body={step.body()}
							icon={<Icon />}
							key={step.id}
							marker={
								<span aria-hidden="true" className={styles.number}>
									{String(index + 1).padStart(2, '0')}
								</span>
							}
							title={step.title()}
						/>
					)
				})}
			</SectionCards>
		</Section>
	)
}
