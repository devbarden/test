import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
	insertApplication,
	replaceApplication,
} from '@/features/applications/api/application.cache'
import { applicationKeys } from '@/features/applications/api/application.queries'
import type {
	ApplicationDto,
	ApplicationInput,
} from '@/features/applications/model/application.schema'
import { refreshUsage } from '@/features/billing/api/billing.cache'
import {
	type GenerationResult,
	useLetterGeneration,
} from '@/features/generation/hooks/use-letter-generation'
import type { ApiError } from '@/lib/api/api-error'
import { redirectToSignIn } from '@/lib/query/query-client'

export function useGenerateApplication(saved: ApplicationDto | undefined) {
	const queryClient = useQueryClient()
	const generation = useLetterGeneration()
	const [lastOutcome, setLastOutcome] = useState<GenerationResult['outcome']>()

	const generate = async (
		input: ApplicationInput,
	): Promise<{ application?: ApplicationDto; error?: ApiError }> => {
		let result: ApplicationDto | undefined

		setLastOutcome(undefined)

		const outcome = await generation.generate(
			{ applicationId: saved?.id, input },
			{
				onComplete: (application) => {
					result = application

					if (saved) replaceApplication(queryClient, application)
					else insertApplication(queryClient, application)
				},
			},
		)

		setLastOutcome(outcome.outcome)
		void queryClient.invalidateQueries({ queryKey: applicationKeys.all })
		void refreshUsage(queryClient)

		if (outcome.outcome === 'failed' && outcome.error.code === 'unauthorized') {
			redirectToSignIn()
		}

		return {
			application: result,
			error: outcome.outcome === 'failed' ? outcome.error : undefined,
		}
	}

	return { ...generation, generate, lastOutcome }
}
