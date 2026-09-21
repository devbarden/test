// ═══════════════════════════════════════════════════════════════════════════
//   The voices a letter can be written in. A property of the application
//   (stored with it, so "Try Again" keeps it); which tones a user may pick
//   is a billing question answered elsewhere (Entitlements.letterTones).
// ═══════════════════════════════════════════════════════════════════════════
export const LETTER_TONES = ['professional', 'warm', 'confident'] as const

export type LetterTone = (typeof LETTER_TONES)[number]

export const DEFAULT_LETTER_TONE: LetterTone = 'professional'
