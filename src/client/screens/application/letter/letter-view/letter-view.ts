import type { ApplicationDto } from '@/domain/applications/application.schema'
import type { GenerationState } from '@/domain/generation/generation-state'
import type { ApiError, ApiErrorCode } from '@/lib/api/api-error'

export type LetterContent =
	| { kind: 'placeholder' }
	| { kind: 'waiting' }
	| { kind: 'streaming'; text: string }
	| { kind: 'saving'; text: string }
	| { kind: 'letter'; text: string }

export type LetterNotice = { error: ApiError; kind: 'failed' } | { kind: 'stopped'; savedLetterKept: boolean }

// ═══════════════════════════════════════════════════════════════════════════
//   A saved letter wins over a failed or stopped retry; partial text shows
//   only when there is nothing better.
// ═══════════════════════════════════════════════════════════════════════════
export function letterContent(state: GenerationState, saved: ApplicationDto | undefined): LetterContent {
	switch (state.status) {
		case 'waiting':
			return { kind: 'waiting' }
		case 'streaming':
			return { kind: 'streaming', text: state.text }
		case 'saving':
			return { kind: 'saving', text: state.text }
		// ═══════════════════════════════════════════════════════════════════
		//   Kept until the saved letter's page takes over, so the new letter
		//   never flashes back to the placeholder in between.
		// ═══════════════════════════════════════════════════════════════════
		case 'done':
			return { kind: 'letter', text: saved?.letter ?? state.text }
		case 'failed':
			return state.error.code === 'save_failed'
				? { kind: 'letter', text: state.text }
				: savedOrPartial(saved, state.text)
		case 'stopped':
			return savedOrPartial(saved, state.text)
		case 'idle':
			return saved ? { kind: 'letter', text: saved.letter } : { kind: 'placeholder' }
	}
}

const PLAN_LIMIT_CODES: readonly ApiErrorCode[] = ['application_limit_reached', 'quota_exceeded']

export function letterNotice(state: GenerationState, saved: ApplicationDto | undefined): LetterNotice | undefined {
	if (state.status === 'failed') {
		return PLAN_LIMIT_CODES.includes(state.error.code) ? undefined : { error: state.error, kind: 'failed' }
	}

	if (state.status === 'stopped') {
		return { kind: 'stopped', savedLetterKept: Boolean(saved) }
	}

	return undefined
}

function savedOrPartial(saved: ApplicationDto | undefined, partial: string): LetterContent {
	if (saved) return { kind: 'letter', text: saved.letter }

	return partial.trim() ? { kind: 'letter', text: partial } : { kind: 'placeholder' }
}
