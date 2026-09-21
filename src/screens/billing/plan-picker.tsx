import { useQuery } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { Heading } from '@/components/ui/heading'
import { LoadError } from '@/components/ui/load-error'
import {
	SegmentedControl,
	type SegmentedOption,
} from '@/components/ui/segmented-control'
import { Skeleton } from '@/components/ui/skeleton'
import { billingQueries } from '@/features/billing/api/billing.queries'
import {
	type BillingPeriod,
	usePlanOffers,
} from '@/features/billing/hooks/use-plan-offers'
import { PlanAction } from './plan-action'
import { PlanCard } from './plan-card'
import styles from './plan-picker.module.css'

const SKELETON_KEYS = ['first', 'second'] as const

const PERIOD_OPTIONS: SegmentedOption<BillingPeriod>[] = [
	{ label: 'Monthly', value: 'month' },
	{ label: 'Annually', value: 'annual' },
]

// ═══════════════════════════════════════════════════════════════════════════
//   Actions wait for the current plan so a card never offers the plan the
//   user already has.
// ═══════════════════════════════════════════════════════════════════════════
export function PlanPicker() {
	const currentPlan = useQuery(billingQueries.overview()).data?.plan
	const { isError, isLoading, offers, retry } = usePlanOffers()
	const [period, setPeriod] = useState<BillingPeriod>('month')
	const titleId = useId()
	const hasAnnualPrices = offers.some((offer) => offer.annualMonthlyFee)

	return (
		<section aria-labelledby={titleId} className={styles.root}>
			<div className={styles.header}>
				<Heading id={titleId} size="sm">
					Choose your plan
				</Heading>
				{hasAnnualPrices && (
					<div className={styles.period}>
						<SegmentedControl
							hideLabel
							label="Billing period"
							onChange={setPeriod}
							options={PERIOD_OPTIONS}
							value={period}
						/>
					</div>
				)}
			</div>
			{isError ? (
				<LoadError onRetry={retry}>Could not load the plans.</LoadError>
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
								action={
									currentPlan && (
										<PlanAction
											currentPlan={currentPlan}
											offer={offer}
											period={period}
										/>
									)
								}
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
