import { usePlans, useSubscription } from '@clerk/tanstack-react-start/experimental'
import { type Entitlements, entitlementsFor, isBillingFeature } from '@/domain/billing/billing-entitlements'
import type { Money } from '@/domain/billing/billing-money'
import { PLAN_IDS, PLAN_SLUGS, type PlanId } from '@/domain/billing/billing-plans'

type ClerkPlan = ReturnType<typeof usePlans>['data'][number]

export type BillingPeriod = 'month' | 'annual'

export type PlanOffer = {
	annualFee: Money | null
	annualMonthlyFee: Money | null
	clerkPlanId: string
	entitlements: Entitlements
	fee: Money
	id: PlanId
	trialDays: number | null
}

type PlanOffers = {
	isError: boolean
	isLoading: boolean
	offers: PlanOffer[]
	retry: () => void
}

export function usePlanOffers(): PlanOffers {
	const plans = usePlans({ for: 'user' })
	const subscription = useSubscription()
	const isEligibleForTrial = subscription.data?.eligibleForFreeTrial ?? false
	const currency = shopCurrency(plans.data)

	const offers = PLAN_IDS.flatMap((id) => {
		const plan = plans.data.find((candidate) => candidate.slug === PLAN_SLUGS[id])

		return plan ? [toOffer(id, plan, currency, isEligibleForTrial)] : []
	})

	return {
		isError: plans.isError,
		isLoading: plans.isLoading || subscription.isLoading,
		offers,
		retry: () => plans.revalidate(),
	}
}

function toOffer(id: PlanId, plan: ClerkPlan, currency: string, isEligibleForTrial: boolean): PlanOffer {
	return {
		annualFee: paid(plan.annualFee),
		annualMonthlyFee: paid(plan.annualMonthlyFee),
		clerkPlanId: plan.id,
		entitlements: entitlementsFor(plan.features.map((feature) => feature.slug).filter(isBillingFeature)),
		fee: { amount: plan.fee?.amount ?? 0, currency },
		id,
		trialDays: isEligibleForTrial && plan.freeTrialEnabled ? plan.freeTrialDays : null,
	}
}

function shopCurrency(plans: readonly ClerkPlan[]): string {
	return plans.find((plan) => plan.fee?.currency)?.fee?.currency ?? 'USD'
}

function paid(fee: ClerkPlan['fee']): Money | null {
	return fee && fee.amount > 0 ? { amount: fee.amount, currency: fee.currency } : null
}
