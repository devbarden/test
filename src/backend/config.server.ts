import { z } from 'zod'
import { FREE_ENTITLEMENTS } from '@/features/billing/billing.catalog'

const emptyAsUndefined = (value: unknown) => (value === '' ? undefined : value)

const optionalSecret = (minLength: number) =>
	z.preprocess(emptyAsUndefined, z.string().min(minLength).optional())

const envSchema = z.object({
	CLERK_SECRET_KEY: z.string().min(1),
	CLERK_WEBHOOK_SIGNING_SECRET: optionalSecret(1),
	CRON_SECRET: optionalSecret(32),
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
//   Parsed once, when the server boots — the container registers the result
//   as a value — so a deploy with a missing or malformed variable fails its
//   healthcheck and never takes traffic, instead of failing the first user
//   who reaches the code path that needs it.
//
//   Operational limits live here too, as code rather than environment: they
//   are decisions reviewed in a pull request, not knobs to turn in a
//   dashboard. Limits that depend on the plan live in the billing catalogue.
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
		cron: { secret: vars.CRON_SECRET },
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
			maxTokens: 800,
		},
		isProduction: vars.NODE_ENV === 'production',
		limits: {
			defaultGenerationsPerDay: FREE_ENTITLEMENTS.dailyGenerations,
			deletedRetentionDays: 30,
			generationsPerMinute: 4,
			requestBodyBytes: 1024 * 1024,
			requestsPerMinutePerIp: 600,
			requestsPerMinutePerUser: 300,
			upstreamRequestsPerMinute: 6,
			webhooksPerMinutePerIp: 60,
		},
		logLevel: vars.LOG_LEVEL,
		nodeEnv: vars.NODE_ENV,
		redis: { url: vars.REDIS_URL },
	}
}

export type AppConfig = ReturnType<typeof createAppConfig>
