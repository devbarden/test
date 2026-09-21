import type { z } from 'zod'

// ═══════════════════════════════════════════════════════════════════════════
//   The validator every server function takes, instead of the bare schema.
//   Handed a schema, TanStack validates it as a Standard Schema and throws a
//   plain Error with the issues as its message — indistinguishable from a
//   crash, so a malformed id came back as `internal`: a 500, retried by the
//   client, where the UI expected `invalid_request`. Parsing here throws the
//   ZodError itself, which the guard reports as the caller's mistake.
//
//   Typed by the schema's input, so a call site is still checked against
//   what the server accepts.
// ═══════════════════════════════════════════════════════════════════════════
export function validateInput<Schema extends z.ZodType>(schema: Schema) {
	return (input: z.input<Schema>): z.output<Schema> => schema.parse(input)
}
