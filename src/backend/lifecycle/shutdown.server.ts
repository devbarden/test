import type { AppContainer } from '../di/container.server'

let registered = false

// ═══════════════════════════════════════════════════════════════════════════
//   On SIGTERM (every Railway redeploy) the HTTP server stops accepting and
//   drains in-flight requests on its own; this closes what it cannot see —
//   the Postgres pool and the Redis connection — so the database is not
//   left holding idle connections from a process that is gone. It never
//   calls process.exit: the server decides when the drain is over.
// ═══════════════════════════════════════════════════════════════════════════
export function registerGracefulShutdown(container: AppContainer): void {
	if (registered) return

	registered = true

	const shutdown = async (signal: NodeJS.Signals) => {
		const { db, redis, rootLogger } = container.cradle

		rootLogger.info({ signal }, 'Shutting down: closing connections')

		await Promise.allSettled([db.$disconnect(), redis.quit()])
	}

	process.once('SIGTERM', shutdown)
	process.once('SIGINT', shutdown)
}
