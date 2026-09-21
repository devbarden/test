import { createFileRoute } from '@tanstack/react-router'
import { pageTitle } from '@/lib/site'
import { m } from '@/paraglide/messages'
import { DashboardScreen } from '@/screens/dashboard/dashboard-screen'

export const Route = createFileRoute('/_authed/applications/')({
	component: DashboardScreen,
	head: () => ({
		meta: [{ title: pageTitle(m['meta.applications.title']()) }],
	}),
})
