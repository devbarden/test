import { PrismaPg } from '@prisma/adapter-pg'
import { type Prisma, PrismaClient } from '@/generated/prisma/client'
import type { AppConfig } from '../config.server'
import type { Logger } from '../observability/logger.server'

export type { PrismaClient }

export type DbClient = PrismaClient | Prisma.TransactionClient

declare global {
	var __altShiftPrisma: PrismaClient | undefined
}

export function createPrismaClient({ config, rootLogger }: { config: AppConfig; rootLogger: Logger }): PrismaClient {
	globalThis.__altShiftPrisma ??= connect(config.database, rootLogger)

	return globalThis.__altShiftPrisma
}

function connect(
	{ connectTimeoutMs, idleConnectionTimeoutMs, poolMax, statementTimeoutMs, url }: AppConfig['database'],
	logger: Logger,
): PrismaClient {
	const client = new PrismaClient({
		adapter: new PrismaPg({
			connectionString: url,
			connectionTimeoutMillis: connectTimeoutMs,
			idle_in_transaction_session_timeout: statementTimeoutMs,
			idleTimeoutMillis: idleConnectionTimeoutMs,
			max: poolMax,
			statement_timeout: statementTimeoutMs,
		}),
		log: [
			{ emit: 'event', level: 'warn' },
			{ emit: 'event', level: 'error' },
		],
	})

	client.$on('warn', (event) => logger.warn({ prisma: event }, 'Prisma'))
	client.$on('error', (event) => logger.error({ prisma: event }, 'Prisma'))

	return client
}
