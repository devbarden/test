export const LETTER_TONES = ['professional', 'warm', 'confident'] as const

export type LetterTone = (typeof LETTER_TONES)[number]

export const DEFAULT_LETTER_TONE: LetterTone = 'professional'

export function effectiveTone(tone: LetterTone, hasTones: boolean): LetterTone {
	return hasTones ? tone : DEFAULT_LETTER_TONE
}
