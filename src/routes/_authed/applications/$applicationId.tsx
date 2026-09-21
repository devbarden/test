import { createFileRoute } from '@tanstack/react-router'
import { StatusPage } from '@/components/layout/status-page'
import { ButtonLink } from '@/components/ui/button'
import { useApplication } from '@/features/applications'
import { ApplicationEditor } from '@/features/editor'

export const Route = createFileRoute('/_authed/applications/$applicationId')({
	component: ApplicationPage,
	head: () => ({ meta: [{ title: 'Application — Alt+Shift' }] }),
})

function ApplicationPage() {
	const { applicationId } = Route.useParams()
	const application = useApplication(applicationId)

	if (!application) {
		return (
			<StatusPage
				action={
					<ButtonLink to="/" variant="secondary">
						Back to applications
					</ButtonLink>
				}
				description="It may have been deleted, possibly in another tab, or it was created in a different browser."
				title="Application not found"
			/>
		)
	}

	return <ApplicationEditor application={application} key={applicationId} />
}
