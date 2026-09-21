import type { ApplicationDto } from '@/features/applications/model/application.schema'
import type { GenerationState } from '@/features/generation/model/generation-state'
import type { ApiError } from '@/lib/api/api-error'

export type LetterContent =
	| { kind: 'placeholder' }
	| { kind: 'waiting' }
	| { kind: 'streaming'; text: string }
	| { kind: 'saving'; text: string }
	| { kind: 'letter'; text: string }

export type LetterNotice =
	| { error: ApiError; kind: 'failed' }
	| { kind: 'stopped'; savedLetterKept: boolean }

// ═══════════════════════════════════════════════════════════════════════════
//   What the letter panel shows, as a pure function of the generation and
//   the saved application — the editor's real state logic, kept out of the
//   component so it can be tested without rendering.
//
//   A saved letter always wins over a broken one: if "Try Again" fails or is
//   stopped, the previous complete letter stays on screen. Partial text is
//   shown only when there is nothing better, so the user can still read
//   (or copy) what arrived. The one exception is a letter that arrived
//   whole but could not be saved: it is the only copy, so it is shown.
// ═══════════════════════════════════════════════════════════════════════════
export function letterContent(
	state: GenerationState,
	saved: ApplicationDto | undefined,
): LetterContent {
	switch (state.status) {
		case 'waiting':
			return { kind: 'waiting' }
		case 'streaming':
			return { kind: 'streaming', text: state.text }
		case 'saving':
			return { kind: 'saving', text: state.text }
		case 'failed':
			return state.error.code === 'save_failed'
				? { kind: 'letter', text: state.text }
				: savedOrPartial(saved, state.text)
		case 'stopped':
			return savedOrPartial(saved, state.text)
		case 'idle':
			return saved
				? { kind: 'letter', text: saved.letter }
				: { kind: 'placeholder' }
	}
}

export function letterNotice(
	state: GenerationState,
	saved: ApplicationDto | undefined,
): LetterNotice | undefined {
	if (state.status === 'failed') return { error: state.error, kind: 'failed' }

	if (state.status === 'stopped') {
		return { kind: 'stopped', savedLetterKept: Boolean(saved) }
	}

	return undefined
}

function savedOrPartial(
	saved: ApplicationDto | undefined,
	partial: string,
): LetterContent {
	if (saved) return { kind: 'letter', text: saved.letter }

	return partial.trim()
		? { kind: 'letter', text: partial }
		: { kind: 'placeholder' }
}
