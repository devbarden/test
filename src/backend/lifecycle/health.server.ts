import type { Redis } from '../cache/redis.server'
import type { PrismaClient } from '../database/prisma.server'

const CHECK_TIMEOUT_MS = 2_000

type CheckStatus = 'ok' | 'down'

export type HealthReport = {
	checks: { database: CheckStatus; redis: CheckStatus }
	status: CheckStatus
}

// ═══════════════════════════════════════════════════════════════════════════
//   Readiness: can this instance serve a real request right now? Railway
//   polls it before switching traffic to a new deployment, so a release
//   that cannot reach its database never goes live.
//
//   Redis is reported but does not fail readiness: the app degrades without
//   it (limits fall back to per-process memory), and refusing all traffic
//   over a degraded dependency would turn a partial outage into a full one.
// ═══════════════════════════════════════════════════════════════════════════
export function createHealthService({
	db,
	redis,
}: {
	db: PrismaClient
	redis: Redis
}) {
	return {
		async check(): Promise<HealthReport> {
			const [database, cache] = await Promise.all([
				probe(() => db.$queryRaw`SELECT 1`),
				probe(() => redis.ping()),
			])

			return {
				checks: { database, redis: cache },
				status: database,
			}
		},
	}
}

export type HealthService = ReturnType<typeof createHealthService>

async function probe(check: () => Promise<unknown>): Promise<CheckStatus> {
	try {
		await Promise.race([
			check(),
			new Promise((_, reject) =>
				setTimeout(() => reject(new Error('timeout')), CHECK_TIMEOUT_MS),
			),
		])

		return 'ok'
	} catch {
		return 'down'
	}
}
