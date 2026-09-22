import { CheckoutButton, SubscriptionDetailsButton } from '@clerk/tanstack-react-start/experimental'
import { Button } from '@/components/ui/button'
import type { PlanId } from '@/domain/billing/billing.catalog'
import type { BillingPeriod, PlanOffer } from '@/features/billing/hooks/use-plan-offers'

type PlanActionProps = {
	currentPlan: PlanId
	offer: PlanOffer
	period: BillingPeriod
}

// ═══════════════════════════════════════════════════════════════════════════
//   The free plan needs no action. The plan the user is on is managed in
//   Clerk's subscription details; any other paid plan is bought through
//   Clerk's checkout, for the chosen period when it has one.
// ═══════════════════════════════════════════════════════════════════════════
export function PlanAction({ currentPlan, offer, period }: PlanActionProps) {
	if (offer.fee.amount === 0) return null

	if (offer.id === currentPlan) {
		return (
			<SubscriptionDetailsButton>
				<Button fullWidth size="md" variant="secondary">
					Manage subscription
				</Button>
			</SubscriptionDetailsButton>
		)
	}

	return (
		<CheckoutButton
			newSubscriptionRedirectUrl="/app/billing"
			planId={offer.clerkPlanId}
			planPeriod={offer.annualMonthlyFee ? period : 'month'}
		>
			<Button fullWidth size="md">
				{offer.trialDays !== null ? `Start ${offer.trialDays}-day free trial` : 'Upgrade to Pro'}
			</Button>
		</CheckoutButton>
	)
}
