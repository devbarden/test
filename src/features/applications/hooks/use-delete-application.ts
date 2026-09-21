import {
	type QueryKey,
	useMutation,
	useQueryClient,
} from '@tanstack/react-query'
import { useToast } from '@/components/ui/toast'
import { readApiError } from '@/lib/api-error'
import { apiErrorMessage } from '@/lib/api-error-message'
import { deleteApplication, restoreApplication } from '../application.api'
import {
	putApplicationInCache,
	removeApplicationFromCache,
} from '../application.cache'
import { applicationKeys } from '../application.queries'
import type { ApplicationDto } from '../application.schema'

// ═══════════════════════════════════════════════════════════════════════════
//   Delete immediately and offer Undo, rather than asking "Are you sure?".
//   The card disappears optimistically; if the server refuses, the cache is
//   rolled back to its snapshot and the user is told. Undo restores the
//   soft-deleted row on the server — the exact letter, not a copy the
//   client sends back — and it returns to its place, since order is by id.
// ═══════════════════════════════════════════════════════════════════════════
export function useDeleteApplication() {
	const queryClient = useQueryClient()
	const showToast = useToast()

	const settle = () =>
		queryClient.invalidateQueries({ queryKey: applicationKeys.all })

	const showError = (error: unknown) =>
		showToast({ message: apiErrorMessage(readApiError(error)) })

	const restore = useMutation({
		mutationFn: (id: string) => restoreApplication({ data: { id } }),
		onError: showError,
		onSettled: settle,
		onSuccess: (application) =>
			putApplicationInCache(queryClient, application, { isNew: true }),
	})

	const remove = useMutation<
		void,
		Error,
		ApplicationDto,
		[QueryKey, unknown][]
	>({
		mutationFn: (application: ApplicationDto) =>
			deleteApplication({ data: { id: application.id } }),
		onError: (error, _application, snapshot) => {
			for (const [queryKey, data] of snapshot ?? []) {
				queryClient.setQueryData(queryKey, data)
			}
			showError(error)
		},
		onMutate: async (application) => {
			await queryClient.cancelQueries({ queryKey: applicationKeys.all })

			const snapshot = queryClient.getQueriesData({
				queryKey: applicationKeys.all,
			})

			removeApplicationFromCache(queryClient, application.id)

			return snapshot
		},
		onSettled: settle,
		onSuccess: (_result, application) =>
			showToast({
				action: {
					label: 'Undo',
					onClick: () => restore.mutate(application.id),
				},
				message: 'Application deleted',
			}),
	})

	return (application: ApplicationDto) => remove.mutate(application)
}
