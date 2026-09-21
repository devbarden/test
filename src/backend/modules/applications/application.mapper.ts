import type { ApplicationDto } from '@/domain/applications/application.schema'
import {
	DEFAULT_LETTER_TONE,
	isLetterTone,
	type LetterTone,
} from '@/domain/applications/application-tone'
import type { Application } from '@/generated/prisma/client'

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
	return isLetterTone(value) ? value : DEFAULT_LETTER_TONE
}
