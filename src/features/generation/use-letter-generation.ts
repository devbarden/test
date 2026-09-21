import { useEffect, useReducer, useRef } from 'react'
import type { ApplicationInput } from '@/features/applications'
import { LetterGenerationFailure, requestLetter } from './generation-client'
import {
	generationReducer,
	IDLE_GENERATION,
	isGenerating,
} from './generation-state'

type GenerateOptions = {
	onComplete: (letter: string) => void
}

export type GenerationOutcome = 'completed' | 'failed' | 'aborted'

// ═══════════════════════════════════════════════════════════════════════════
//   One generation at a time per editor. Starting a new one aborts the
//   previous request, and unmounting aborts whatever is in flight — the
//   server sees the disconnect and cancels the upstream call, so a letter
//   nobody is waiting for does not keep spending the shared rate limit.
//
//   `onComplete` runs before the state returns to idle, so the saved letter
//   is already in storage when the streaming view hands over to it: there
//   is no frame in which the panel is empty between the two.
// ═══════════════════════════════════════════════════════════════════════════
export function useLetterGeneration() {
	const [state, dispatch] = useReducer(generationReducer, IDLE_GENERATION)
	const controllerRef = useRef<AbortController | null>(null)

	useEffect(() => () => controllerRef.current?.abort(), [])

	const generate = async (
		input: ApplicationInput,
		{ onComplete }: GenerateOptions,
	): Promise<GenerationOutcome> => {
		controllerRef.current?.abort()

		const controller = new AbortController()
		controllerRef.current = controller
		dispatch({ type: 'start' })

		let letter = ''

		try {
			for await (const text of requestLetter(input, controller.signal)) {
				letter += text
				dispatch({ text, type: 'delta' })
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

		try {
			onComplete(letter.trim())
			dispatch({ type: 'complete' })
			return 'completed'
		} catch {
			dispatch({ error: { code: 'not_saved' }, type: 'fail' })
			return 'failed'
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
