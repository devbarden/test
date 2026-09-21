import { PRODUCT_BENEFITS } from '@/features/marketing/model/product-content'
import { PRODUCT_BENEFIT_ICONS } from '@/features/marketing/ui/product-icons'
import { m } from '@/paraglide/messages'
import { LANDING_SECTIONS } from '../landing-sections'
import { Section } from './section'
import { SectionCard } from './section-card'
import { SectionCards } from './section-cards'

export function Features() {
	return (
		<Section
			id={LANDING_SECTIONS.features.id}
			kicker={m['landing.features.kicker']()}
			title={m['landing.features.title']()}
		>
			<SectionCards as="ul">
				{PRODUCT_BENEFITS.map((feature) => {
					const Icon = PRODUCT_BENEFIT_ICONS[feature.id]

					return (
						<SectionCard
							body={feature.body()}
							icon={<Icon />}
							key={feature.id}
							spacious
							title={feature.title()}
						/>
					)
				})}
			</SectionCards>
		</Section>
	)
}
