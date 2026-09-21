import clsx from 'clsx'
import { Container } from '@/components/layout/container'
import { Panel } from '@/components/ui/panel'
import { PRODUCT_BENEFITS } from '@/features/marketing/model/product-content'
import { PRODUCT_BENEFIT_ICONS } from '@/features/marketing/ui/product-icons'
import { m } from '@/paraglide/messages'
import { LANDING_SECTIONS } from '../landing-sections'
import { Reveal } from '../reveal/reveal'
import styles from './features.module.css'
import section from './section.module.css'
import { SectionHeading } from './section-heading'

export function Features() {
	return (
		<section className={section.section} id={LANDING_SECTIONS.features.id}>
			<Container>
				<SectionHeading
					kicker={m['landing.features.kicker']()}
					title={m['landing.features.title']()}
				/>
				<Reveal as="ul" className={section.cardGrid} stagger>
					{PRODUCT_BENEFITS.map((feature) => {
						const Icon = PRODUCT_BENEFIT_ICONS[feature.id]

						return (
							<Panel
								as="li"
								className={clsx(section.card, styles.feature)}
								interactive
								key={feature.id}
								tone="raised"
							>
								<span className={section.iconChip}>
									<Icon />
								</span>
								<h3 className={clsx(section.cardTitle, styles.title)}>
									{feature.title()}
								</h3>
								<p className={section.cardBody}>{feature.body()}</p>
							</Panel>
						)
					})}
				</Reveal>
			</Container>
		</section>
	)
}
