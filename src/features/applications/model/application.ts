import { z } from 'zod'

// ═══════════════════════════════════════════════════════════════════════════
//   What is persisted, validated on the way IN from storage. The input is
//   checked for shape only, not against today's form limits: tightening a
//   limit later must not silently delete letters people already have.
// ═══════════════════════════════════════════════════════════════════════════
export const applicationSchema = z.object({
	createdAt: z.number(),
	id: z.string().min(1),
	input: z.object({
		company: z.string(),
		details: z.string(),
		jobTitle: z.string(),
		skills: z.string(),
	}),
	letter: z.string().min(1),
	updatedAt: z.number(),
})

export type Application = z.infer<typeof applicationSchema>

export const APPLICATION_GOAL = 5
