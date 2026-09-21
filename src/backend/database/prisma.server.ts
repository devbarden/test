import { PrismaPg } from '@prisma/adapter-pg'
import { type Prisma, PrismaClient } from '@/generated/prisma/client'
import type { AppConfig } from '../config.server'
import type { Logger } from '../observability/logger.server'

export type { PrismaClient }

// ═══════════════════════════════════════════════════════════════════════════
//   What a repository method runs its query on: the shared client, or the
//   transaction a caller opened — so several methods can be composed inside
//   one transaction and all run on its connection.
// ═══════════════════════════════════════════════════════════════════════════
export type DbClient = PrismaClient | Prisma.TransactionClient

const globalCache = globalThis as { __altShiftPrisma?: PrismaClient }

// ═══════════════════════════════════════════════════════════════════════════
//   One client — one connection pool — per process. In development the
//   module graph is re-evaluated on every edit, and without the global
//   cache each reload would open a fresh pool until Postgres ran out of
//   connections.
//
//   The pool is sized per instance (DATABASE_POOL_MAX); the total a
//   deployment can open is that times the replica count, which must stay
//   under the database's max_connections.
//
//   Every connection carries server-side timeouts: a statement that runs
//   away, or a transaction left idle by a crashed request, is ended by
//   Postgres instead of holding a pooled connection (and an advisory lock)
//   until the process restarts.
// ═══════════════════════════════════════════════════════════════════════════
export function createPrismaClient({
	config,
	rootLogger,
}: {
	config: AppConfig
	rootLogger: Logger
}): PrismaClient {
	if (globalCache.__altShiftPrisma) return globalCache.__altShiftPrisma

	const { poolMax, statementTimeoutMs, url } = config.database
	const client = new PrismaClient({
		adapter: new PrismaPg({
			connectionString: url,
			connectionTimeoutMillis: 5_000,
			idle_in_transaction_session_timeout: statementTimeoutMs,
			idleTimeoutMillis: 30_000,
			max: poolMax,
			statement_timeout: statementTimeoutMs,
		}),
		log: [
			{ emit: 'event', level: 'warn' },
			{ emit: 'event', level: 'error' },
		],
	})

	client.$on('warn', (event) => rootLogger.warn({ prisma: event }, 'Prisma'))
	client.$on('error', (event) => rootLogger.error({ prisma: event }, 'Prisma'))

	if (!config.isProduction) globalCache.__altShiftPrisma = client

	return client
}
