import { createFileRoute, useLocation } from '@tanstack/react-router'
import { pageTitle } from '@/lib/document/brand'
import { ApplicationScreen } from '@/screens/application/application-screen'

export const Route = createFileRoute('/app/applications/$applicationId')({
	component: ApplicationRoute,
	head: () => ({ meta: [{ title: pageTitle('Application') }] }),
})

function ApplicationRoute() {
	const { applicationId } = Route.useParams()
	const letterJustSaved = useLocation({
		select: (location) => location.state.letterJustSaved === true,
	})

	return (
		<ApplicationScreen
			applicationId={applicationId}
			justSaved={letterJustSaved}
		/>
	)
}
