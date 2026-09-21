import type { Application } from '@/generated/prisma/client'
import type { ApplicationDto } from './application.schema'
import {
	DEFAULT_LETTER_TONE,
	LETTER_TONES,
	type LetterTone,
} from './application-tone'

export function toApplicationDto(row: Application): ApplicationDto {
	return {
		createdAt: row.createdAt.toISOString(),
		id: row.id,
		input: {
			company: row.company,
			details: row.details,
			jobTitle: row.jobTitle,
			skills: row.skills,
			tone: toLetterTone(row.tone),
		},
		letter: row.letter,
		updatedAt: row.updatedAt.toISOString(),
	}
}

// ═══════════════════════════════════════════════════════════════════════════
//   The column is free text so a tone can be retired without a migration;
//   a value this build no longer offers reads as the default instead of
//   breaking the letter it belongs to.
// ═══════════════════════════════════════════════════════════════════════════
function toLetterTone(value: string): LetterTone {
	return (LETTER_TONES as readonly string[]).includes(value)
		? (value as LetterTone)
		: DEFAULT_LETTER_TONE
}
