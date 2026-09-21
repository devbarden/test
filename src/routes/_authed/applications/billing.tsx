import { createFileRoute } from '@tanstack/react-router'
import { pageTitle } from '@/lib/site'
import { m } from '@/paraglide/messages'
import { BillingScreen } from '@/screens/billing/billing-screen'

export const Route = createFileRoute('/_authed/applications/billing')({
	component: BillingScreen,
	head: () => ({ meta: [{ title: pageTitle(m['meta.billing.title']()) }] }),
})
