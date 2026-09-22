import { createFileRoute, useLocation } from '@tanstack/react-router'
import { useEffect } from 'react'
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

	// ═════════════════════════════════════════════════════════════════════════
	//   Read once: history state survives reloads and Back, which must not
	//   move focus to the letter or announce it again.
	// ═════════════════════════════════════════════════════════════════════════
	useEffect(() => {
		if (!letterJustSaved) return

		const { letterJustSaved: _consumed, ...state } = window.history.state ?? {}

		window.history.replaceState(state, '')
	}, [letterJustSaved])

	return <ApplicationScreen applicationId={applicationId} justSaved={letterJustSaved} />
}
