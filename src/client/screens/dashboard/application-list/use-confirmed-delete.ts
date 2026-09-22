import { useQueryClient } from '@tanstack/react-query'
import { useDeleteApplication } from '@/client/features/applications/hooks/use-delete-application'
import { refreshUsage } from '@/client/features/billing/api/billing.cache'
import { ConfirmDialog } from '@/client/kit/confirm-dialog'
import type { ApplicationDto } from '@/domain/applications/application.schema'
import { applicationLabel } from '@/domain/applications/application-title'
import { useListFocus } from './use-list-focus'

// ═══════════════════════════════════════════════════════════════════════════
//   Asks first, then deletes; focus moves to the neighbouring card, and
//   back to the letter if Undo restores it.
// ═══════════════════════════════════════════════════════════════════════════
export function useConfirmedDelete(items: readonly ApplicationDto[] | undefined) {
	const queryClient = useQueryClient()
	const focus = useListFocus(items)
	const deleteApplication = useDeleteApplication({
		onRestored: focus.afterRestoring,
		onSettled: () => refreshUsage(queryClient),
	})

	return async (application: ApplicationDto) => {
		const confirmed = await ConfirmDialog.call({
			confirmLabel: 'Delete',
			message: `“${applicationLabel(application.input)}” and its cover letter will be deleted.`,
			title: 'Delete this application?',
			tone: 'danger',
		})

		if (!confirmed) return

		focus.afterRemoving(application)
		deleteApplication(application)
	}
}
