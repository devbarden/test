import { PRODUCT_STEPS } from '@/features/marketing/ui/product-content'
import { PRODUCT_STEP_ICONS } from '@/features/marketing/ui/product-icons'
import { LANDING_SECTIONS } from '../landing-sections'
import styles from './how-it-works.module.css'
import { Section } from './section'
import { SectionCard } from './section-card'
import { SectionCards } from './section-cards'

export function HowItWorks() {
	return (
		<Section
			lead="No templates and no blank page. You describe the job; Alt+Shift does the writing."
			section={LANDING_SECTIONS.howItWorks}
			title="From a job post to a sent letter in three steps"
			tone="ink"
		>
			<SectionCards as="ol">
				{PRODUCT_STEPS.map((step, index) => {
					const Icon = PRODUCT_STEP_ICONS[step.id]

					return (
						<SectionCard
							body={step.body}
							icon={<Icon />}
							key={step.id}
							marker={
								<span aria-hidden="true" className={styles.number}>
									{String(index + 1).padStart(2, '0')}
								</span>
							}
							title={step.title}
						/>
					)
				})}
			</SectionCards>
		</Section>
	)
}
