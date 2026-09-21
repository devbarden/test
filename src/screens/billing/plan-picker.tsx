import {
	CheckoutButton,
	SubscriptionDetailsButton,
} from '@clerk/tanstack-react-start/experimental'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { LoadError } from '@/components/ui/load-error'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Skeleton } from '@/components/ui/skeleton'
import {
	type BillingPeriod,
	type PlanOffer,
	usePlanOffers,
} from '@/features/billing/hooks/use-plan-offers'
import type { PlanId } from '@/features/billing/model/billing.catalog'
import { m } from '@/paraglide/messages'
import { PlanCard } from './plan-card'
import styles from './plan-picker.module.css'

const SKELETON_KEYS = ['first', 'second'] as const

type PlanPickerProps = {
	currentPlan: PlanId | undefined
}

// ═══════════════════════════════════════════════════════════════════════════
//   The plans drawn by the app itself, not by Clerk's pricing table: the
//   cards speak the product's language and look, and Clerk keeps only the
//   parts that must be its own — the checkout drawer, which handles the
//   card, 3-D Secure and receipts, and the subscription details behind
//   "Manage".
//
//   Actions wait for the current plan, read from the same server overview
//   as the usage above, so a card never offers an upgrade to the plan the
//   user already has while a fresh session token is on its way.
// ═══════════════════════════════════════════════════════════════════════════
export function PlanPicker({ currentPlan }: PlanPickerProps) {
	const { isError, isLoading, offers, retry } = usePlanOffers()
	const [period, setPeriod] = useState<BillingPeriod>('month')
	const titleId = useId()
	const hasAnnualPrices = offers.some((offer) => offer.annualMonthlyFee)

	return (
		<section aria-labelledby={titleId} className={styles.root}>
			<div className={styles.header}>
				<Heading id={titleId} size="sm">
					{m['billing.plansTitle']()}
				</Heading>
				{hasAnnualPrices && (
					<div className={styles.period}>
						<SegmentedControl
							hideLabel
							label={m['billing.plans.period']()}
							onChange={setPeriod}
							options={[
								{ label: m['billing.plans.monthly'](), value: 'month' },
								{ label: m['billing.plans.annual'](), value: 'annual' },
							]}
							value={period}
						/>
					</div>
				)}
			</div>
			{isError ? (
				<LoadError onRetry={retry}>{m['billing.plans.loadFailed']()}</LoadError>
			) : isLoading ? (
				<div aria-hidden="true" className={styles.grid}>
					{SKELETON_KEYS.map((key) => (
						<Skeleton className={styles.skeleton} key={key} shape="block" />
					))}
				</div>
			) : (
				<ul className={styles.grid}>
					{offers.map((offer) => (
						<li key={offer.id}>
							<PlanCard
								action={planAction(offer, currentPlan, period)}
								isCurrent={offer.id === currentPlan}
								offer={offer}
								period={period}
							/>
						</li>
					))}
				</ul>
			)}
		</section>
	)
}

function planAction(
	offer: PlanOffer,
	currentPlan: PlanId | undefined,
	period: BillingPeriod,
) {
	if (!currentPlan || offer.fee.amount === 0) return null

	if (offer.id === currentPlan) {
		return (
			<SubscriptionDetailsButton>
				<Button fullWidth size="md" variant="secondary">
					{m['billing.manage']()}
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
				{offer.trialDays !== null
					? m['billing.plans.trial']({ days: offer.trialDays })
					: m['billing.plans.upgrade']()}
			</Button>
		</CheckoutButton>
	)
}
