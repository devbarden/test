import { type ActionDispatch, useEffect, useReducer, useRef } from 'react'
import type { ApplicationDto } from '@/features/applications/model/application.schema'
import type { ApiError } from '@/lib/api/api-error'
import {
	LetterGenerationFailure,
	requestLetter,
} from '../api/generation-client'
import {
	type GenerationAction,
	generationReducer,
	IDLE_GENERATION,
	isGenerating,
	isStoppable,
} from '../model/generation-state'
import type { GenerateCommand } from '../model/protocol'

type GenerateOptions = {
	onComplete: (application: ApplicationDto) => void
}

export type GenerationResult =
	| { outcome: 'aborted' | 'completed' }
	| { error: ApiError; outcome: 'failed' }

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
		options: GenerateOptions,
	): Promise<GenerationResult> => {
		controllerRef.current?.abort()

		const controller = new AbortController()
		controllerRef.current = controller

		const outcome = await streamLetter(
			command,
			controller.signal,
			dispatch,
			options,
		)

		if (controllerRef.current === controller) controllerRef.current = null

		return outcome
	}

	const stop = () => {
		if (!isStoppable(state)) return

		controllerRef.current?.abort()
		dispatch({ type: 'stop' })
	}

	return {
		canStop: isStoppable(state),
		generate,
		isGenerating: isGenerating(state),
		state,
		stop,
	}
}

// ═══════════════════════════════════════════════════════════════════════════
//   Outside the hook so the React Compiler can still compile the hook: it
//   does not yet lower `for (;;)` or `try … finally`, and skips any function
//   that contains them. Never throws — every ending is an outcome.
// ═══════════════════════════════════════════════════════════════════════════
async function streamLetter(
	command: GenerateCommand,
	signal: AbortSignal,
	dispatch: ActionDispatch<[GenerationAction]>,
	{ onComplete }: GenerateOptions,
): Promise<GenerationResult> {
	dispatch({ type: 'start' })

	try {
		const stream = requestLetter(command, signal)

		for (;;) {
			const next = await stream.next()

			if (signal.aborted) return { outcome: 'aborted' }

			if (next.done) {
				onComplete(next.value)
				dispatch({ type: 'complete' })
				return { outcome: 'completed' }
			}

			dispatch(next.value)
		}
	} catch (cause) {
		if (signal.aborted) return { outcome: 'aborted' }

		const error =
			cause instanceof LetterGenerationFailure
				? cause.error
				: { code: 'interrupted' as const }

		dispatch({ error, type: 'fail' })
		return { error, outcome: 'failed' }
	}
}
