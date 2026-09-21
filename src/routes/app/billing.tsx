import { createFileRoute } from '@tanstack/react-router'
import { pageTitle } from '@/lib/site'
import { m } from '@/paraglide/messages'
import { BillingScreen } from '@/screens/billing/billing-screen'

export const Route = createFileRoute('/app/billing')({
	component: BillingScreen,
	head: () => ({ meta: [{ title: pageTitle(m['meta.billing.title']()) }] }),
})
