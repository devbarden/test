import { PricingTable } from '@clerk/tanstack-react-start'
import { SubscriptionDetailsButton } from '@clerk/tanstack-react-start/experimental'
import { useQuery } from '@tanstack/react-query'
import { useId } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { LoadError } from '@/components/ui/load-error'
import { Skeleton } from '@/components/ui/skeleton'
import { billingQueries } from '@/features/billing/api/billing.queries'
import { m } from '@/paraglide/messages'
import styles from './billing-screen.module.css'
import { UsageSummary } from './usage-summary'

// ═══════════════════════════════════════════════════════════════════════════
//   Checkout, plan changes and payment methods are Clerk's own components:
//   they run on Stripe through Clerk, handle 3-D flows, receipts and
//   cancellation, and keep card data off this origin entirely. This page
//   adds only what Clerk cannot know — how much of the plan is used.
//
//   The plan shown and the Manage button read the same source, the server's
//   overview, so the page never says "Free" beside "Manage subscription"
//   while a new session token is still on its way.
// ═══════════════════════════════════════════════════════════════════════════
export function BillingScreen() {
	const overview = useQuery(billingQueries.overview())
	const plansTitleId = useId()

	return (
		<div className={styles.screen}>
			<PageHeader
				actions={
					overview.data?.plan === 'pro' && (
						<SubscriptionDetailsButton>
							<Button variant="secondary">{m['billing.manage']()}</Button>
						</SubscriptionDetailsButton>
					)
				}
				title={m['billing.title']()}
			/>
			{overview.data ? (
				<UsageSummary overview={overview.data} />
			) : overview.isError ? (
				<LoadError onRetry={() => overview.refetch()}>
					{m['billing.loadFailed']()}
				</LoadError>
			) : (
				<Skeleton className={styles.skeleton} shape="block" />
			)}
			<section aria-labelledby={plansTitleId} className={styles.plans}>
				<Heading id={plansTitleId} size="sm">
					{m['billing.plansTitle']()}
				</Heading>
				<PricingTable newSubscriptionRedirectUrl="/applications/billing" />
			</section>
		</div>
	)
}
