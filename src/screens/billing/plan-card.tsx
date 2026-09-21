import { CheckIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Heading } from '@/components/ui/heading'
import { Panel } from '@/components/ui/panel'
import type {
	BillingPeriod,
	PlanOffer,
} from '@/features/billing/hooks/use-plan-offers'
import type { Entitlements } from '@/features/billing/model/billing.catalog'
import { formatMoney } from '@/features/billing/model/money'
import { useLocale } from '@/lib/i18n/use-locale'
import { m } from '@/paraglide/messages'
import styles from './plan-card.module.css'
import { PLAN_DESCRIPTIONS, PLAN_NAMES } from './plan-copy'

type PlanCardProps = {
	action?: ReactNode
	isCurrent: boolean
	offer: PlanOffer
	period: BillingPeriod
}

export function PlanCard({ action, isCurrent, offer, period }: PlanCardProps) {
	const locale = useLocale()
	const isFree = offer.fee.amount === 0
	const isAnnual = period === 'annual' && offer.annualMonthlyFee !== null
	const price = isAnnual ? (offer.annualMonthlyFee ?? offer.fee) : offer.fee

	const note = isFree
		? m['billing.plans.freeNote']()
		: isAnnual && offer.annualFee
			? m['billing.plans.billedAnnually']({
					amount: formatMoney(offer.annualFee, locale),
				})
			: m['billing.plans.billedMonthly']()

	return (
		<Panel className={styles.root} tone={isFree ? 'muted' : 'success'}>
			<div className={styles.head}>
				<Heading as="h3" size="sm">
					{PLAN_NAMES[offer.id]()}
				</Heading>
				{isCurrent ? (
					<Badge>{m['billing.plans.current']()}</Badge>
				) : (
					offer.trialDays !== null && (
						<Badge>
							{m['billing.plans.trialBadge']({ days: offer.trialDays })}
						</Badge>
					)
				)}
			</div>
			<p className={styles.description}>{PLAN_DESCRIPTIONS[offer.id]()}</p>
			<div className={styles.pricing}>
				<p className={styles.price}>
					<span className={styles.amount}>{formatMoney(price, locale)}</span>
					{!isFree && (
						<span className={styles.per}>{m['billing.plans.perMonth']()}</span>
					)}
				</p>
				<p className={styles.note}>{note}</p>
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

function featureLines(entitlements: Entitlements): string[] {
	return [
		m['billing.plans.dailyGenerations']({
			count: entitlements.dailyGenerations,
		}),
		m['billing.plans.maxApplications']({
			count: entitlements.maxApplications,
		}),
		entitlements.letterTones
			? m['billing.plans.letterTones']()
			: m['billing.plans.defaultTone'](),
	]
}
