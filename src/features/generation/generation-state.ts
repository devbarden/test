import type { ApiError } from '@/lib/api-error'

// ═══════════════════════════════════════════════════════════════════════════
//   `waiting` and `streaming` are separate on purpose: the first is the
//   seconds before the model says anything (the orb), the second is text
//   arriving (the letter writing itself). `failed` and `stopped` keep the
//   partial text, so the user sees what they got before it broke off.
// ═══════════════════════════════════════════════════════════════════════════
export type GenerationState =
	| { status: 'idle' }
	| { status: 'waiting' }
	| { status: 'streaming'; text: string }
	| { error: ApiError; status: 'failed'; text: string }
	| { status: 'stopped'; text: string }

export type GenerationAction =
	| { type: 'start' }
	| { text: string; type: 'delta' }
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
		case 'delta':
			return {
				status: 'streaming',
				text: `${textOf(state)}${action.text}`,
			}
		case 'complete':
			return IDLE_GENERATION
		case 'fail':
			return { error: action.error, status: 'failed', text: textOf(state) }
		case 'stop':
			return isGenerating(state)
				? { status: 'stopped', text: textOf(state) }
				: state
	}
}

export function isGenerating(state: GenerationState): boolean {
	return state.status === 'waiting' || state.status === 'streaming'
}

function textOf(state: GenerationState): string {
	return 'text' in state ? state.text : ''
}
