import { z } from 'zod'

const optionalSecret = z.preprocess((value) => (value === '' ? undefined : value), z.string().min(1).optional())

const envSchema = z.object({
	CLERK_SECRET_KEY: z.string().min(1),
	CLERK_WEBHOOK_SIGNING_SECRET: optionalSecret,
	DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
	DATABASE_URL: z.url(),
	GENERATION_API_TOKEN: z.string().min(1),
	GENERATION_API_URL: z.url().default('https://test-assignment-api.variant.net/v1/generate'),
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	REDIS_URL: z.url(),
})

export function createAppConfig(env: NodeJS.ProcessEnv = process.env) {
	const parsed = envSchema.safeParse(env)

	if (!parsed.success) {
		throw new Error(`Invalid environment configuration:\n${z.prettifyError(parsed.error)}`)
	}

	const vars = parsed.data

	return {
		clerk: { webhookSigningSecret: vars.CLERK_WEBHOOK_SIGNING_SECRET },
		database: {
			connectTimeoutMs: 5_000,
			idleConnectionTimeoutMs: 30_000,
			poolMax: vars.DATABASE_POOL_MAX,
			statementTimeoutMs: 10_000,
			url: vars.DATABASE_URL,
		},
		// ═════════════════════════════════════════════════════════════════════
		//   maxDurationMs < lockTtlMs, so the one-generation lock never expires
		//   under a running letter.
		// ═════════════════════════════════════════════════════════════════════
		generation: {
			apiToken: vars.GENERATION_API_TOKEN,
			apiUrl: vars.GENERATION_API_URL,
			idleTimeoutMs: 30_000,
			lockTtlMs: 120_000,
			maxDurationMs: 90_000,
			maxLetterCharacters: 20_000,
			maxTokens: 800,
		},
		http: { maxRequestBodyBytes: 1024 * 1024 },
		isProduction: vars.NODE_ENV === 'production',
		redis: { connectTimeoutMs: 2_000, url: vars.REDIS_URL },
	}
}

export type AppConfig = ReturnType<typeof createAppConfig>
