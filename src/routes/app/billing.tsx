import { createFileRoute } from '@tanstack/react-router'
import { pageTitle } from '@/lib/document/brand'
import { BillingScreen } from '@/screens/billing/billing-screen'

export const Route = createFileRoute('/app/billing')({
	component: BillingScreen,
	head: () => ({ meta: [{ title: pageTitle('Plan & billing') }] }),
})
