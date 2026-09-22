import { createFileRoute } from '@tanstack/react-router'
import { pageTitle } from '@/client/lib/document/brand'
import { NewApplicationScreen } from '@/client/screens/application/new-application-screen'

export const Route = createFileRoute('/app/applications/create')({
	component: NewApplicationScreen,
	head: () => ({
		meta: [{ title: pageTitle('New application') }],
	}),
})
