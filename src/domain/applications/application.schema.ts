import { z } from 'zod'
import { toPlainText } from '@/lib/text/plain-text'
import { SEARCH_MAX_LENGTH } from './application-search'
import { DEFAULT_LETTER_TONE, LETTER_TONES } from './application-tone'

export const INPUT_LIMITS = {
	company: 100,
	details: 1200,
	jobTitle: 100,
	skills: 300,
} as const

// ═══════════════════════════════════════════════════════════════════════════
//   `max` runs before `trim` so the button agrees with the raw-length
//   counter under the textarea.
// ═══════════════════════════════════════════════════════════════════════════
const text = (maxLength: number) =>
	z.string().max(maxLength).overwrite(toPlainText).trim()

export const applicationInputSchema = z.object({
	company: text(INPUT_LIMITS.company).min(1),
	details: text(INPUT_LIMITS.details),
	jobTitle: text(INPUT_LIMITS.jobTitle).min(1),
	skills: text(INPUT_LIMITS.skills).min(1),
	tone: z.enum(LETTER_TONES),
})

export type ApplicationInput = z.infer<typeof applicationInputSchema>

export const EMPTY_APPLICATION_INPUT: ApplicationInput = {
	company: '',
	details: '',
	jobTitle: '',
	skills: '',
	tone: DEFAULT_LETTER_TONE,
}

export const applicationDtoSchema = z.object({
	createdAt: z.iso.datetime(),
	id: z.uuid(),
	input: z.object({
		company: z.string(),
		details: z.string(),
		jobTitle: z.string(),
		skills: z.string(),
		tone: z.enum(LETTER_TONES),
	}),
	letter: z.string(),
	updatedAt: z.iso.datetime(),
})

export type ApplicationDto = z.infer<typeof applicationDtoSchema>

export const applicationIdSchema = z.object({ id: z.uuid() })

export const listApplicationsSchema = z.object({
	cursor: z.uuid().optional(),
	search: z.string().max(SEARCH_MAX_LENGTH).optional(),
})

export type ApplicationPage = {
	items: ApplicationDto[]
	nextCursor: string | null
}

export type ApplicationStats = {
	goal: number
	limit: number
	total: number
}

export const APPLICATION_GOAL = 5

export const APPLICATIONS_PAGE_SIZE = 10
