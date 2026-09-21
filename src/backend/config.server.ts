import { z } from 'zod'

const emptyAsUndefined = (value: unknown) => (value === '' ? undefined : value)

const optionalSecret = (minLength: number) =>
	z.preprocess(emptyAsUndefined, z.string().min(minLength).optional())

const envSchema = z.object({
	CLERK_SECRET_KEY: z.string().min(1),
	CLERK_WEBHOOK_SIGNING_SECRET: optionalSecret(1),
	DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
	DATABASE_URL: z.url(),
	GENERATION_API_TOKEN: z.string().min(1),
	GENERATION_API_URL: z
		.url()
		.default('https://test-assignment-api.variant.net/v1/generate'),
	LOG_LEVEL: z
		.enum(['trace', 'debug', 'info', 'warn', 'error', 'silent'])
		.default('info'),
	NODE_ENV: z
		.enum(['development', 'production', 'test'])
		.default('development'),
	REDIS_URL: z.url(),
})

// ═══════════════════════════════════════════════════════════════════════════
//   Parsed when the server boots (lifecycle/server-lifecycle.nitro.ts), so
//   a deploy with a missing or malformed variable crashes before it listens
//   and never takes traffic, instead of failing the first user who reaches
//   the code path that needs it. The container then registers one parsed
//   copy as a value.
//
//   Operational limits live here too, as code rather than environment: they
//   are decisions reviewed in a pull request, not knobs to turn in a
//   dashboard. Limits that depend on the plan live in the billing catalogue
//   and reach the limiter per request, never through this file.
//
//   The generation bounds are chosen together: a letter may take at most
//   maxDurationMs, which is shorter than lockTtlMs, so the one-generation-
//   per-user lock can never expire under a generation that is still
//   running.
// ═══════════════════════════════════════════════════════════════════════════
export function createAppConfig(env: NodeJS.ProcessEnv = process.env) {
	const parsed = envSchema.safeParse(env)

	if (!parsed.success) {
		throw new Error(
			`Invalid environment configuration:\n${z.prettifyError(parsed.error)}`,
		)
	}

	const vars = parsed.data

	return {
		clerk: { webhookSigningSecret: vars.CLERK_WEBHOOK_SIGNING_SECRET },
		database: {
			poolMax: vars.DATABASE_POOL_MAX,
			statementTimeoutMs: 10_000,
			url: vars.DATABASE_URL,
		},
		generation: {
			apiToken: vars.GENERATION_API_TOKEN,
			apiUrl: vars.GENERATION_API_URL,
			firstByteTimeoutMs: 30_000,
			idleTimeoutMs: 20_000,
			lockTtlMs: 120_000,
			maxDurationMs: 90_000,
			maxLetterCharacters: 20_000,
			maxTokens: 800,
		},
		http: { maxRequestBodyBytes: 1024 * 1024 },
		isProduction: vars.NODE_ENV === 'production',
		logLevel: vars.LOG_LEVEL,
		nodeEnv: vars.NODE_ENV,
		rateLimits: {
			generationsPerMinute: 4,
			requestsPerMinutePerIp: 600,
			requestsPerMinutePerUser: 300,
			systemRequestsPerMinute: 300,
			upstreamRequestsPerMinute: 6,
		},
		redis: { url: vars.REDIS_URL },
	}
}

export type AppConfig = ReturnType<typeof createAppConfig>
