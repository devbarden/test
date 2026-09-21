import { z } from 'zod'
import { toPlainText } from '@/lib/plain-text'
import { DEFAULT_LETTER_TONE, LETTER_TONES } from './application-tone'

export const INPUT_LIMITS = {
	company: 100,
	details: 1200,
	jobTitle: 100,
	skills: 300,
} as const

// ═══════════════════════════════════════════════════════════════════════════
//   The single definition of a valid application, shared by the form (to
//   enable "Generate Now") and by /api/generate (to refuse anything else).
//   `max` runs BEFORE `trim` on purpose: the counter under the textarea
//   shows the raw length, and the button must agree with the counter —
//   1201 characters of which one is a trailing space is still "over".
//
//   Control characters are dropped before anything else sees the text (see
//   toPlainText): a NUL pasted into a field would otherwise pass here and
//   fail only at save time, after the letter was generated.
// ═══════════════════════════════════════════════════════════════════════════
const text = (maxLength: number) =>
	z.string().max(maxLength).overwrite(toPlainText).trim()

export const applicationInputSchema = z.object({
	company: text(INPUT_LIMITS.company).min(1),
	details: text(INPUT_LIMITS.details),
	jobTitle: text(INPUT_LIMITS.jobTitle).min(1),
	skills: text(INPUT_LIMITS.skills).min(1),
	tone: z.enum(LETTER_TONES).default(DEFAULT_LETTER_TONE),
})

export type ApplicationInput = z.infer<typeof applicationInputSchema>

export const EMPTY_APPLICATION_INPUT: ApplicationInput = {
	company: '',
	details: '',
	jobTitle: '',
	skills: '',
	tone: DEFAULT_LETTER_TONE,
}

// ═══════════════════════════════════════════════════════════════════════════
//   What the API returns. Dates travel as ISO strings: the same shape goes
//   through server functions, the NDJSON stream and the browser's persisted
//   query cache, and only a string survives all three unchanged.
// ═══════════════════════════════════════════════════════════════════════════
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

export const APPLICATIONS_PAGE_SIZE = 24
