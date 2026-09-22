import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { useToast } from '@/components/ui/toast'
import type { ApplicationDto } from '@/domain/applications/application.schema'
import { readApiError } from '@/lib/api/api-error'
import { errorMessage } from '@/lib/api/api-error-message'
import { deleteApplication, restoreApplication } from '../api/application.api'
import { insertApplication, refreshApplications, removeApplication } from '../api/application.cache'
import { applicationKeys } from '../api/application.queries'

type DeleteOptions = {
	onRestored?: (application: ApplicationDto) => void
	onSettled?: () => void
}

export function useDeleteApplication({ onRestored, onSettled }: DeleteOptions = {}) {
	const queryClient = useQueryClient()
	const showToast = useToast()
	const pending = useRef(new Set<string>())

	const settle = async () => {
		await refreshApplications(queryClient)
		onSettled?.()
	}

	const showError = (error: unknown) => showToast({ message: errorMessage(error) })

	const restore = useMutation({
		mutationFn: (id: string) => restoreApplication({ data: { id } }),
		onError: showError,
		onMutate: () => queryClient.cancelQueries({ queryKey: applicationKeys.lists() }),
		onSettled: settle,
		onSuccess: (application) => {
			insertApplication(queryClient, application)
			onRestored?.(application)
		},
	})

	const remove = useMutation({
		mutationFn: async (application: ApplicationDto) => {
			try {
				await deleteApplication({ data: { id: application.id } })
			} catch (error) {
				if (readApiError(error).code !== 'not_found') throw error
			}
		},
		onError: (error, application) => {
			insertApplication(queryClient, application)
			showError(error)
		},
		onMutate: async (application) => {
			await queryClient.cancelQueries({ queryKey: applicationKeys.all })
			removeApplication(queryClient, application.id)
		},
		onSettled: (_result, _error, application) => {
			pending.current.delete(application.id)
			return settle()
		},
		onSuccess: (_result, application) =>
			showToast({
				action: {
					label: 'Undo',
					onClick: () => restore.mutate(application.id),
				},
				message: 'Application deleted',
			}),
	})

	return (application: ApplicationDto) => {
		if (pending.current.has(application.id)) return

		pending.current.add(application.id)
		remove.mutate(application)
	}
}
