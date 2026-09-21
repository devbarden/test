import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { StatusPage } from '@/components/layout/status-page'
import { Button, ButtonLink } from '@/components/ui/button'
import {
	applicationQueries,
	findApplicationInList,
} from '@/features/applications'
import { ApplicationEditor } from '@/features/editor'
import { readApiError } from '@/lib/api-error'
import { apiErrorMessage } from '@/lib/api-error-message'

export const Route = createFileRoute('/_authed/applications/$applicationId')({
	component: ApplicationPage,
	head: () => ({ meta: [{ title: 'Application — Alt+Shift' }] }),
})

// ═══════════════════════════════════════════════════════════════════════════
//   Opened from the dashboard, the letter is already in the list cache and
//   renders on the first frame; the detail query then revalidates it.
//   Opened from a link, it is fetched. The editor mounts only once the
//   letter is known: its form is initialised from it exactly once.
// ═══════════════════════════════════════════════════════════════════════════
function ApplicationPage() {
	const { applicationId } = Route.useParams()
	const queryClient = useQueryClient()
	const application = useQuery({
		...applicationQueries.detail(applicationId),
		initialData: () => findApplicationInList(queryClient, applicationId),
	})

	if (application.data) {
		return (
			<ApplicationEditor application={application.data} key={applicationId} />
		)
	}

	if (application.isError) {
		const error = readApiError(application.error)

		return error.code === 'not_found' || error.code === 'invalid_request' ? (
			<StatusPage
				action={
					<ButtonLink to="/" variant="secondary">
						Back to applications
					</ButtonLink>
				}
				description="It may have been deleted, possibly in another tab."
				title="Application not found"
			/>
		) : (
			<StatusPage
				action={
					<Button onClick={() => application.refetch()} variant="secondary">
						Try again
					</Button>
				}
				description={apiErrorMessage(error)}
				title="Could not open this application"
			/>
		)
	}

	return (
		<span aria-busy="true" className="visually-hidden">
			Loading…
		</span>
	)
}
