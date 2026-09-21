import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'
import type { AppConfig } from '../config.server'

export type { PrismaClient }

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
// ═══════════════════════════════════════════════════════════════════════════
export function createPrismaClient({
	config,
}: {
	config: AppConfig
}): PrismaClient {
	if (globalCache.__altShiftPrisma) return globalCache.__altShiftPrisma

	const client = new PrismaClient({
		adapter: new PrismaPg({
			connectionString: config.database.url,
			connectionTimeoutMillis: 5_000,
			idleTimeoutMillis: 30_000,
			max: config.database.poolMax,
		}),
	})

	if (!config.isProduction) globalCache.__altShiftPrisma = client

	return client
}
