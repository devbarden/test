import type { Application } from '@/generated/prisma/client'
import type { ApplicationDto } from './application.schema'

export function toApplicationDto(row: Application): ApplicationDto {
	return {
		createdAt: row.createdAt.toISOString(),
		id: row.id,
		input: {
			company: row.company,
			details: row.details,
			jobTitle: row.jobTitle,
			skills: row.skills,
		},
		letter: row.letter,
		updatedAt: row.updatedAt.toISOString(),
	}
}
