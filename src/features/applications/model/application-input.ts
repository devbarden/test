import { z } from 'zod'

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
// ═══════════════════════════════════════════════════════════════════════════
export const applicationInputSchema = z.object({
	company: z.string().max(INPUT_LIMITS.company).trim().min(1),
	details: z.string().max(INPUT_LIMITS.details).trim(),
	jobTitle: z.string().max(INPUT_LIMITS.jobTitle).trim().min(1),
	skills: z.string().max(INPUT_LIMITS.skills).trim().min(1),
})

export type ApplicationInput = z.infer<typeof applicationInputSchema>

export const EMPTY_APPLICATION_INPUT: ApplicationInput = {
	company: '',
	details: '',
	jobTitle: '',
	skills: '',
}
