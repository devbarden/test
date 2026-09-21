import type { ApiError } from '@/lib/api/api-error'

export type GenerationState =
	| { status: 'idle' }
	| { status: 'waiting' }
	| { status: 'streaming'; text: string }
	| { status: 'saving'; text: string }
	| { error: ApiError; status: 'failed'; text: string }
	| { status: 'stopped'; text: string }

export type GenerationAction =
	| { type: 'start' }
	| { text: string; type: 'delta' }
	| { type: 'saving' }
	| { type: 'complete' }
	| { error: ApiError; type: 'fail' }
	| { type: 'stop' }

export const IDLE_GENERATION: GenerationState = { status: 'idle' }

export function generationReducer(
	state: GenerationState,
	action: GenerationAction,
): GenerationState {
	switch (action.type) {
		case 'start':
			return { status: 'waiting' }
		case 'stop':
			return isStoppable(state)
				? { status: 'stopped', text: textOf(state) }
				: state
	}

	// ═══════════════════════════════════════════════════════════════════════
	//   A fragment that arrives after Stop must not revive the letter.
	// ═══════════════════════════════════════════════════════════════════════
	if (!isGenerating(state)) return state

	switch (action.type) {
		case 'delta':
			if (state.status === 'saving') return state

			return {
				status: 'streaming',
				text: `${textOf(state)}${action.text}`,
			}
		case 'saving':
			return { status: 'saving', text: textOf(state) }
		case 'complete':
			return IDLE_GENERATION
		case 'fail':
			return { error: action.error, status: 'failed', text: textOf(state) }
	}
}

export function isGenerating(state: GenerationState): boolean {
	return (
		state.status === 'waiting' ||
		state.status === 'streaming' ||
		state.status === 'saving'
	)
}

// ═══════════════════════════════════════════════════════════════════════════
//   After `saving` the letter is stored regardless, so no Stop.
// ═══════════════════════════════════════════════════════════════════════════
export function isStoppable(state: GenerationState): boolean {
	return state.status === 'waiting' || state.status === 'streaming'
}

function textOf(state: GenerationState): string {
	return 'text' in state ? state.text : ''
}
