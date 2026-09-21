import { createFileRoute } from '@tanstack/react-router'
import { pageTitle } from '@/lib/site'
import { m } from '@/paraglide/messages'
import { NewApplicationScreen } from '@/screens/application/new-application-screen'

export const Route = createFileRoute('/app/applications/create')({
	component: NewApplicationScreen,
	head: () => ({
		meta: [{ title: pageTitle(m['meta.newApplication.title']()) }],
	}),
})
