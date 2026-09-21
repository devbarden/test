import { Container } from '@/components/layout/container'
import { Panel } from '@/components/ui/panel'
import { PRODUCT_STEPS } from '@/features/marketing/model/product-content'
import { PRODUCT_STEP_ICONS } from '@/features/marketing/ui/product-icons'
import { m } from '@/paraglide/messages'
import { LANDING_SECTIONS } from '../landing-sections'
import { Reveal } from '../reveal/reveal'
import styles from './how-it-works.module.css'
import section from './section.module.css'
import { SectionHeading } from './section-heading'

export function HowItWorks() {
	return (
		<section className={section.section} id={LANDING_SECTIONS.howItWorks.id}>
			<Container>
				<div className={section.ink}>
					<SectionHeading
						kicker={m['landing.steps.kicker']()}
						lead={m['landing.steps.lead']()}
						title={m['landing.steps.title']()}
					/>
					<Reveal as="ol" className={section.cardGrid} stagger>
						{PRODUCT_STEPS.map((step, index) => {
							const Icon = PRODUCT_STEP_ICONS[step.id]

							return (
								<Panel
									as="li"
									className={section.card}
									interactive
									key={step.id}
									tone="raised"
								>
									<div className={styles.top}>
										<span className={section.iconChip}>
											<Icon />
										</span>
										<span aria-hidden="true" className={styles.number}>
											{String(index + 1).padStart(2, '0')}
										</span>
									</div>
									<h3 className={section.cardTitle}>{step.title()}</h3>
									<p className={section.cardBody}>{step.body()}</p>
								</Panel>
							)
						})}
					</Reveal>
				</div>
			</Container>
		</section>
	)
}
