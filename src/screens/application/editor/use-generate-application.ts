import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type {
	ApplicationDto,
	ApplicationInput,
} from '@/domain/applications/application.schema'
import {
	insertApplication,
	replaceApplication,
} from '@/features/applications/api/application.cache'
import { applicationKeys } from '@/features/applications/api/application.queries'
import { refreshUsage } from '@/features/billing/api/billing.cache'
import { usePlanLimits } from '@/features/billing/hooks/use-plan-limits'
import {
	type GenerationResult,
	useLetterGeneration,
} from '@/features/generation/hooks/use-letter-generation'
import type { ApiError } from '@/lib/api/api-error'
import { redirectToSignIn } from '@/lib/query/query-client'

type Options = {
	onStart?: () => void
}

// ═══════════════════════════════════════════════════════════════════════════
//   Writes a letter for the editor: a new one, or over `saved` for Try
//   Again. A plan limit the usage already shows stops it before a request
//   is spent; one the server reports anyway is explained the same way.
//   Resolves with the saved letter, or undefined when there is none.
// ═══════════════════════════════════════════════════════════════════════════
export function useGenerateApplication(
	saved: ApplicationDto | undefined,
	{ onStart }: Options = {},
) {
	const queryClient = useQueryClient()
	const generation = useLetterGeneration()
	const planLimits = usePlanLimits()
	const [lastOutcome, setLastOutcome] = useState<GenerationResult['outcome']>()

	const explainRefusal = (error: ApiError) => {
		if (error.code === 'unauthorized') redirectToSignIn()
		if (error.code === 'quota_exceeded') {
			planLimits.explain('daily', error.retryAfterSeconds)
		}
		if (error.code === 'application_limit_reached') planLimits.explain('saved')
	}

	const generate = async (
		input: ApplicationInput,
	): Promise<ApplicationDto | undefined> => {
		const limit = planLimits.reached({ creates: !saved })

		if (limit) {
			planLimits.explain(limit)
			return undefined
		}

		let written: ApplicationDto | undefined

		onStart?.()
		setLastOutcome(undefined)

		const result = await generation.generate(
			{ applicationId: saved?.id, input },
			{
				onComplete: (application) => {
					written = application

					if (saved) replaceApplication(queryClient, application)
					else insertApplication(queryClient, application)
				},
			},
		)

		setLastOutcome(result.outcome)
		void queryClient.invalidateQueries({ queryKey: applicationKeys.all })
		void refreshUsage(queryClient)

		if (result.outcome === 'failed') explainRefusal(result.error)

		return written
	}

	return { ...generation, generate, lastOutcome }
}
