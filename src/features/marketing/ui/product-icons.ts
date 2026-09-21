import {
	ArchiveIcon,
	ClipboardCheckIcon,
	FingerprintIcon,
	type LucideIcon,
	PenLineIcon,
	SparklesIcon,
	TargetIcon,
} from 'lucide-react'
import type { ProductBenefitId, ProductStepId } from '../model/product-content'

// ═══════════════════════════════════════════════════════════════════════════
//   One picture per step and per benefit, keyed by id so a reordered list
//   never shows a step with its neighbour's icon — and kept apart from the
//   copy itself, which the server also reads for llms.txt.
// ═══════════════════════════════════════════════════════════════════════════
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
