import type { z } from 'zod'

// ═══════════════════════════════════════════════════════════════════════════
//   A bare schema fails as a plain Error (500); throwing the ZodError makes
//   it invalid_request.
// ═══════════════════════════════════════════════════════════════════════════
export function validateInput<Schema extends z.ZodType>(schema: Schema) {
	return (input: z.input<Schema>): z.output<Schema> => schema.parse(input)
}
