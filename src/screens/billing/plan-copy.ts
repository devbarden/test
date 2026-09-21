import type { PlanId } from '@/features/billing/model/billing.catalog'
import { m } from '@/paraglide/messages'

export const PLAN_NAMES: Record<PlanId, () => string> = {
	free: () => m['billing.plan.free'](),
	pro: () => m['billing.plan.pro'](),
}

export const PLAN_DESCRIPTIONS: Record<PlanId, () => string> = {
	free: () => m['billing.plans.freeDescription'](),
	pro: () => m['billing.plans.proDescription'](),
}
