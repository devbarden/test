import { Alert } from '@/components/ui/alert'
import { apiErrorMessage } from '@/lib/api/api-error-message'
import type { LetterNotice } from './letter-view'

type LetterNoticeAlertProps = {
	notice: LetterNotice
}

export function LetterNoticeAlert({ notice }: LetterNoticeAlertProps) {
	if (notice.kind === 'failed') {
		return <Alert tone="danger">{apiErrorMessage(notice.error)}</Alert>
	}

	return (
		<Alert tone="info">
			{notice.savedLetterKept
				? 'Stopped. Your previous letter is unchanged.'
				: 'Stopped before the letter was finished, so it was not saved.'}
		</Alert>
	)
}
