export const PLAN_IDS = ['free', 'pro'] as const

export type PlanId = (typeof PLAN_IDS)[number]

export const PLAN_SLUGS: Record<PlanId, string> = {
	free: 'free_user',
	pro: 'pro',
}
