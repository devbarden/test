import { useQuery, useQueryClient } from '@tanstack/react-query'
import { applicationFromList } from '@/features/applications/api/application.cache'
import { applicationQueries } from '@/features/applications/api/application.queries'
import { readApiError } from '@/lib/api/api-error'
import { ApplicationUnavailable, isMissing } from './application-unavailable/application-unavailable'
import { ApplicationEditor } from './editor/application-editor/application-editor'

type ApplicationScreenProps = {
	applicationId: string
	justSaved: boolean
}

// ═══════════════════════════════════════════════════════════════════════════
//   Opens from the list's copy of the letter when there is one, so a click
//   on a card shows it at once while the letter itself revalidates.
// ═══════════════════════════════════════════════════════════════════════════
export function ApplicationScreen({ applicationId, justSaved }: ApplicationScreenProps) {
	const queryClient = useQueryClient()
	const application = useQuery({
		...applicationQueries.detail(applicationId),
		initialData: () => applicationFromList(queryClient, applicationId)?.data,
		initialDataUpdatedAt: () => applicationFromList(queryClient, applicationId)?.updatedAt,
	})

	// ═════════════════════════════════════════════════════════════════════════
	//   A failed revalidation keeps the cached letter, so a letter deleted
	//   elsewhere must be checked for before it is shown as if it existed.
	// ═════════════════════════════════════════════════════════════════════════
	const isGone = application.isError && isMissing(readApiError(application.error))

	if (application.data && !isGone) {
		return <ApplicationEditor justSaved={justSaved} key={applicationId} saved={application.data} />
	}

	if (application.isError) {
		return <ApplicationUnavailable error={application.error} onRetry={() => application.refetch()} />
	}

	return (
		<p className="visually-hidden" role="status">
			Loading…
		</p>
	)
}
