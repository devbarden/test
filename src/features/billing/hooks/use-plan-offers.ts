import {
	usePlans,
	useSubscription,
} from '@clerk/tanstack-react-start/experimental'
import {
	type Entitlements,
	entitlementsFor,
	isBillingFeature,
	PLAN_IDS,
	PLAN_SLUGS,
	type PlanId,
} from '../model/billing.catalog'
import type { Money } from '../model/money'

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

// ═══════════════════════════════════════════════════════════════════════════
//   The plans as Clerk sells them — price, trial, the features each one
//   carries — read through the catalogue, so a card lists the same limits
//   the server enforces rather than the marketing names typed into Clerk's
//   dashboard (which are English only). A trial is offered only to a user
//   who has not had one.
// ═══════════════════════════════════════════════════════════════════════════
export function usePlanOffers(): PlanOffers {
	const plans = usePlans({ for: 'user' })
	const subscription = useSubscription()
	const isEligibleForTrial = subscription.data?.eligibleForFreeTrial ?? false
	const currency = shopCurrency(plans.data)

	const offers = PLAN_IDS.flatMap((id) => {
		const plan = plans.data.find(
			(candidate) => candidate.slug === PLAN_SLUGS[id],
		)

		return plan ? [toOffer(id, plan, currency, isEligibleForTrial)] : []
	})

	return {
		isError: plans.isError,
		isLoading: plans.isLoading || subscription.isLoading,
		offers,
		retry: () => void plans.revalidate(),
	}
}

function toOffer(
	id: PlanId,
	plan: ClerkPlan,
	currency: string,
	isEligibleForTrial: boolean,
): PlanOffer {
	return {
		annualFee: paid(plan.annualFee),
		annualMonthlyFee: paid(plan.annualMonthlyFee),
		clerkPlanId: plan.id,
		entitlements: entitlementsFor(
			plan.features.map((feature) => feature.slug).filter(isBillingFeature),
		),
		fee: { amount: plan.fee?.amount ?? 0, currency },
		id,
		trialDays:
			isEligibleForTrial && plan.freeTrialEnabled ? plan.freeTrialDays : null,
	}
}

// ═══════════════════════════════════════════════════════════════════════════
//   A free plan comes back from Clerk with an empty currency, so "$0" is
//   written in the currency the paid plans are sold in.
// ═══════════════════════════════════════════════════════════════════════════
function shopCurrency(plans: readonly ClerkPlan[]): string {
	return plans.find((plan) => plan.fee?.currency)?.fee?.currency ?? 'USD'
}

function paid(fee: ClerkPlan['fee']): Money | null {
	return fee && fee.amount > 0
		? { amount: fee.amount, currency: fee.currency }
		: null
}
