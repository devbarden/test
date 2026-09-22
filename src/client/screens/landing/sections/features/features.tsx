import { PRODUCT_BENEFITS } from '@/client/features/marketing/ui/product-content'
import { PRODUCT_BENEFIT_ICONS } from '@/client/features/marketing/ui/product-icons'
import { LANDING_SECTIONS } from '../../landing-sections'
import { Section } from '../section'
import { SectionCard } from '../section-card'
import { SectionCards } from '../section-cards'

export function Features() {
	return (
		<Section section={LANDING_SECTIONS.features} title="Built for the whole job hunt, not a single letter">
			<SectionCards as="ul">
				{PRODUCT_BENEFITS.map((feature) => {
					const Icon = PRODUCT_BENEFIT_ICONS[feature.id]

					return <SectionCard body={feature.body} icon={<Icon />} key={feature.id} spacious title={feature.title} />
				})}
			</SectionCards>
		</Section>
	)
}
