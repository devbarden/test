import type { PlanId } from '@/domain/billing/billing-plans'

export const PLAN_NAMES: Record<PlanId, string> = {
	free: 'Free',
	pro: 'Pro',
}

export const PLAN_DESCRIPTIONS: Record<PlanId, string> = {
	free: 'For trying it out and the occasional application.',
	pro: 'For an active job search: more letters, a longer history and your own voice.',
}
