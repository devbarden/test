import { createFileRoute, useLocation } from '@tanstack/react-router'
import { pageTitle } from '@/lib/site'
import { m } from '@/paraglide/messages'
import { ApplicationScreen } from '@/screens/application/application-screen'

export const Route = createFileRoute('/_authed/applications/$applicationId')({
	component: ApplicationRoute,
	head: () => ({ meta: [{ title: pageTitle(m['meta.application.title']()) }] }),
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
