import { useEffect, useReducer, useRef } from 'react'
import type { ApplicationDto } from '@/features/applications/application.schema'
import { LetterGenerationFailure, requestLetter } from './generation-client'
import {
	generationReducer,
	IDLE_GENERATION,
	isGenerating,
} from './generation-state'
import type { GenerateCommand } from './protocol'

type GenerateOptions = {
	onComplete: (application: ApplicationDto) => void
}

export type GenerationOutcome = 'completed' | 'failed' | 'aborted'

// ═══════════════════════════════════════════════════════════════════════════
//   One generation at a time per editor. Starting a new one aborts the
//   previous request, and unmounting aborts whatever is in flight — the
//   server sees the disconnect and cancels the upstream call, so a letter
//   nobody is waiting for does not keep spending the shared rate limit.
//
//   `onComplete` receives the application as the server SAVED it, and runs
//   before the state returns to idle, so the cache already holds the letter
//   when the streaming view hands over to it.
// ═══════════════════════════════════════════════════════════════════════════
export function useLetterGeneration() {
	const [state, dispatch] = useReducer(generationReducer, IDLE_GENERATION)
	const controllerRef = useRef<AbortController | null>(null)

	useEffect(() => () => controllerRef.current?.abort(), [])

	const generate = async (
		command: GenerateCommand,
		{ onComplete }: GenerateOptions,
	): Promise<GenerationOutcome> => {
		controllerRef.current?.abort()

		const controller = new AbortController()
		controllerRef.current = controller
		dispatch({ type: 'start' })

		try {
			const stream = requestLetter(command, controller.signal)

			for (;;) {
				const next = await stream.next()

				if (next.done) {
					onComplete(next.value)
					dispatch({ type: 'complete' })
					return 'completed'
				}

				dispatch({ text: next.value, type: 'delta' })
			}
		} catch (cause) {
			if (controller.signal.aborted) return 'aborted'

			dispatch({
				error:
					cause instanceof LetterGenerationFailure
						? cause.error
						: { code: 'interrupted' },
				type: 'fail',
			})
			return 'failed'
		} finally {
			if (controllerRef.current === controller) controllerRef.current = null
		}
	}

	const stop = () => {
		controllerRef.current?.abort()
		dispatch({ type: 'stop' })
	}

	return {
		generate,
		isGenerating: isGenerating(state),
		state,
		stop,
	}
}
