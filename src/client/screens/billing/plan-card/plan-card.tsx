import { CheckIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { BillingPeriod, PlanOffer } from '@/client/features/billing/hooks/use-plan-offers'
import { Badge } from '@/client/kit/badge'
import { Heading } from '@/client/kit/heading'
import { Panel } from '@/client/kit/panel'
import type { Entitlements } from '@/domain/billing/billing-entitlements'
import { formatMoney } from '@/domain/billing/billing-money'
import { PLAN_DESCRIPTIONS, PLAN_NAMES } from '../plan-copy'
import styles from './plan-card.module.css'

type PlanCardProps = {
	action?: ReactNode
	isCurrent: boolean
	offer: PlanOffer
	period: BillingPeriod
}

export function PlanCard({ action, isCurrent, offer, period }: PlanCardProps) {
	const isFree = offer.fee.amount === 0
	const annualPrice = period === 'annual' ? offer.annualMonthlyFee : null
	const isAnnual = annualPrice !== null
	const price = annualPrice ?? offer.fee

	return (
		<Panel className={styles.root} tone={isFree ? 'muted' : 'success'}>
			<div className={styles.head}>
				<Heading as="h3" size="sm">
					{PLAN_NAMES[offer.id]}
				</Heading>
				{isCurrent ? (
					<Badge>Current plan</Badge>
				) : (
					offer.trialDays !== null && <Badge>{`${offer.trialDays} days free`}</Badge>
				)}
			</div>
			<p className={styles.description}>{PLAN_DESCRIPTIONS[offer.id]}</p>
			<div className={styles.pricing}>
				<p className={styles.price}>
					<span className={styles.amount}>{formatMoney(price)}</span>
					{!isFree && <span className={styles.per}>/ month</span>}
				</p>
				<p className={styles.note}>{billingNote(offer, isAnnual)}</p>
			</div>
			<ul className={styles.features}>
				{featureLines(offer.entitlements).map((line) => (
					<li className={styles.feature} key={line}>
						<span aria-hidden="true" className={styles.check}>
							<CheckIcon strokeWidth={3} />
						</span>
						{line}
					</li>
				))}
			</ul>
			{action && <div className={styles.action}>{action}</div>}
		</Panel>
	)
}

function billingNote(offer: PlanOffer, isAnnual: boolean): string {
	if (offer.fee.amount === 0) return 'Free forever, no card needed'
	if (isAnnual && offer.annualFee) {
		return `${formatMoney(offer.annualFee)} billed once a year`
	}

	return 'Billed monthly, cancel any time'
}

function featureLines(entitlements: Entitlements): string[] {
	return [
		`${entitlements.dailyGenerations} letters a day`,
		`${entitlements.maxApplications} saved applications`,
		entitlements.letterTones ? 'Professional, warm and confident tones' : 'Professional tone',
	]
}
