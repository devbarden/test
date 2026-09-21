import { PrismaPg } from '@prisma/adapter-pg'
import { type Prisma, PrismaClient } from '@/generated/prisma/client'
import type { AppConfig } from '../config.server'
import type { Logger } from '../observability/logger.server'

export type { PrismaClient }

export type DbClient = PrismaClient | Prisma.TransactionClient

const globalCache = globalThis as { __altShiftPrisma?: PrismaClient }

// ═══════════════════════════════════════════════════════════════════════════
//   Cached per process: without it every dev reload opens a new pool.
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
