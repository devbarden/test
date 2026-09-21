import { Alert } from '@/components/ui/alert'
import { apiErrorMessage } from '@/lib/api/api-error-message'
import { m } from '@/paraglide/messages'
import type { LetterNotice } from './letter-view'

export function LetterNoticeAlert({ notice }: { notice: LetterNotice }) {
	if (notice.kind === 'failed') {
		return <Alert tone="danger">{apiErrorMessage(notice.error)}</Alert>
	}

	return (
		<Alert tone="info">
			{notice.savedLetterKept
				? m['editor.stoppedSaved']()
				: m['editor.stoppedUnsaved']()}
		</Alert>
	)
}
