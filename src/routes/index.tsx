import { createFileRoute } from '@tanstack/react-router'
import { pageTitle } from '@/client/lib/document/brand'
import { LandingScreen } from '@/client/screens/landing/landing-screen'

export const Route = createFileRoute('/')({
	component: LandingScreen,
	head: () => ({ meta: [{ title: pageTitle('AI cover letter generator') }] }),
})
