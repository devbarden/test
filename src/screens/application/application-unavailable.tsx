import { StatusPage } from '@/components/layout/status-page'
import { Button, ButtonLink } from '@/components/ui/button'
import { type ApiError, readApiError } from '@/lib/api/api-error'
import { apiErrorMessage } from '@/lib/api/api-error-message'

type ApplicationUnavailableProps = {
	error: unknown
	onRetry: () => void
}

// ═══════════════════════════════════════════════════════════════════════════
//   A letter that is gone (or an id that was never one) leads back to the
//   list; anything else is worth another try.
// ═══════════════════════════════════════════════════════════════════════════
export function ApplicationUnavailable({
	error,
	onRetry,
}: ApplicationUnavailableProps) {
	const apiError = readApiError(error)

	if (isMissing(apiError)) {
		return (
			<StatusPage
				action={
					<ButtonLink to="/app/applications" variant="secondary">
						Back to applications
					</ButtonLink>
				}
				description="It may have been deleted, possibly in another tab."
				title="Application not found"
			/>
		)
	}

	return (
		<StatusPage
			action={
				<Button onClick={onRetry} variant="secondary">
					Try again
				</Button>
			}
			description={apiErrorMessage(apiError)}
			title="Could not open this application"
		/>
	)
}

function isMissing({ code }: ApiError): boolean {
	return code === 'not_found' || code === 'invalid_request'
}
