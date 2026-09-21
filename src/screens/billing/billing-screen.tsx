import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/page-header'
import { LoadError } from '@/components/ui/load-error'
import { Skeleton } from '@/components/ui/skeleton'
import { billingQueries } from '@/features/billing/api/billing.queries'
import { m } from '@/paraglide/messages'
import styles from './billing-screen.module.css'
import { PlanPicker } from './plan-picker'
import { UsageSummary } from './usage-summary'

// ═══════════════════════════════════════════════════════════════════════════
//   Payment itself stays with Clerk: its checkout and subscription screens
//   run on Stripe, handle 3-D flows, receipts and cancellation, and keep
//   card data off this origin entirely. This page adds what Clerk cannot
//   know — how much of the plan is used — and draws the plans in the
//   product's own design.
// ═══════════════════════════════════════════════════════════════════════════
export function BillingScreen() {
	const overview = useQuery(billingQueries.overview())

	return (
		<div className={styles.root}>
			<PageHeader title={m['billing.title']()} />
			{overview.data ? (
				<UsageSummary overview={overview.data} />
			) : overview.isError ? (
				<LoadError onRetry={() => overview.refetch()}>
					{m['billing.loadFailed']()}
				</LoadError>
			) : (
				<Skeleton className={styles.skeleton} shape="block" />
			)}
			<PlanPicker currentPlan={overview.data?.plan} />
		</div>
	)
}
