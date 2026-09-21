import type { Application } from '@/generated/prisma/client'
import type { ApplicationDto } from './model/application.schema'
import {
	DEFAULT_LETTER_TONE,
	LETTER_TONES,
	type LetterTone,
} from './model/application-tone'

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

function toLetterTone(value: string): LetterTone {
	return (LETTER_TONES as readonly string[]).includes(value)
		? (value as LetterTone)
		: DEFAULT_LETTER_TONE
}
