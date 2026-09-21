import {
	ArchiveIcon,
	ClipboardCheckIcon,
	FingerprintIcon,
	type LucideIcon,
	PenLineIcon,
	SparklesIcon,
	TargetIcon,
} from 'lucide-react'
import type { ProductBenefitId, ProductStepId } from './product-content'

export const PRODUCT_STEP_ICONS: Record<ProductStepId, LucideIcon> = {
	one: PenLineIcon,
	three: ClipboardCheckIcon,
	two: SparklesIcon,
}

export const PRODUCT_BENEFIT_ICONS: Record<ProductBenefitId, LucideIcon> = {
	goal: TargetIcon,
	saved: ArchiveIcon,
	voice: FingerprintIcon,
}
