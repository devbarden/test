import { z } from 'zod'

const serverEnvSchema = z.object({
	GENERATION_API_TOKEN: z.string().min(1),
	GENERATION_API_URL: z
		.url()
		.default('https://test-assignment-api.variant.net/v1/generate'),
})

type ServerEnv = z.infer<typeof serverEnvSchema>

let cached: ServerEnv | undefined

// ═══════════════════════════════════════════════════════════════════════════
//   Read on first use, not at import: a missing token should fail the first
//   generation with a clear message in the log, not crash the whole server
//   at boot and take the dashboard down with it.
// ═══════════════════════════════════════════════════════════════════════════
export function getServerEnv(): ServerEnv {
	cached ??= serverEnvSchema.parse(process.env)

	return cached
}
