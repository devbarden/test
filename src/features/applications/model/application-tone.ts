// ═══════════════════════════════════════════════════════════════════════════
//   The voices a letter can be written in. A property of the application
//   (stored with it, so "Try Again" keeps it); which tones a user may pick
//   is a billing question answered elsewhere (Entitlements.letterTones).
// ═══════════════════════════════════════════════════════════════════════════
export const LETTER_TONES = ['professional', 'warm', 'confident'] as const

export type LetterTone = (typeof LETTER_TONES)[number]

export const DEFAULT_LETTER_TONE: LetterTone = 'professional'

// ═══════════════════════════════════════════════════════════════════════════
//   The tone a letter is written in: the saved one when the plan includes
//   tones, the default when it does not. The server refuses any other tone
//   without the feature, so this is also exactly what gets sent — a letter
//   saved in "Warm" and reopened after a downgrade is rewritten in the
//   default tone, not refused. The saved tone itself is kept, and comes
//   back as soon as the feature does.
// ═══════════════════════════════════════════════════════════════════════════
export function effectiveTone(tone: LetterTone, hasTones: boolean): LetterTone {
	return hasTones ? tone : DEFAULT_LETTER_TONE
}
