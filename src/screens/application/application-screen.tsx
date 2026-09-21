import { useQuery, useQueryClient } from '@tanstack/react-query'
import { StatusPage } from '@/components/layout/status-page'
import { Button, ButtonLink } from '@/components/ui/button'
import { applicationFromList } from '@/features/applications/api/application.cache'
import { applicationQueries } from '@/features/applications/api/application.queries'
import { readApiError } from '@/lib/api/api-error'
import { apiErrorMessage } from '@/lib/api/api-error-message'
import { m } from '@/paraglide/messages'
import { ApplicationEditor } from './editor/application-editor'

type ApplicationScreenProps = {
	applicationId: string
	justSaved: boolean
}

// ═══════════════════════════════════════════════════════════════════════════
//   Opened from the dashboard, the letter is already in the list cache and
//   renders on the first frame; the detail query then revalidates it.
//   Opened from a link, it is fetched. The editor mounts only once the
//   letter is known: its form is initialised from it exactly once.
// ═══════════════════════════════════════════════════════════════════════════
export function ApplicationScreen({
	applicationId,
	justSaved,
}: ApplicationScreenProps) {
	const queryClient = useQueryClient()
	const application = useQuery({
		...applicationQueries.detail(applicationId),
		initialData: () => applicationFromList(queryClient, applicationId)?.data,
		initialDataUpdatedAt: () =>
			applicationFromList(queryClient, applicationId)?.updatedAt,
	})

	if (application.data) {
		return (
			<ApplicationEditor
				justSaved={justSaved}
				key={applicationId}
				saved={application.data}
			/>
		)
	}

	if (application.isError) {
		const error = readApiError(application.error)

		return error.code === 'not_found' || error.code === 'invalid_request' ? (
			<StatusPage
				action={
					<ButtonLink to="/app/applications" variant="secondary">
						{m['application.backToList']()}
					</ButtonLink>
				}
				description={m['application.notFoundDescription']()}
				title={m['application.notFoundTitle']()}
			/>
		) : (
			<StatusPage
				action={
					<Button onClick={() => application.refetch()} variant="secondary">
						{m['common.tryAgain']()}
					</Button>
				}
				description={apiErrorMessage(error)}
				title={m['application.openFailedTitle']()}
			/>
		)
	}

	return (
		<p className="visually-hidden" role="status">
			{m['application.loading']()}
		</p>
	)
}
