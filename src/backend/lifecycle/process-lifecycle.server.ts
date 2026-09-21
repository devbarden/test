import type { AppContainer } from '../di/container.server'
import { publishCloseConnections } from './shutdown-handle'

let registered = false

// ═══════════════════════════════════════════════════════════════════════════
//   Everything that happens to the process rather than to a request.
//
//   Shutdown: the connections are closed by Nitro's `close` hook
//   (server-lifecycle.nitro.ts), which runs once the HTTP server has
//   drained. Closing them on SIGTERM itself — as this once did — pulled the
//   pool out from under requests still in flight, and every deploy failed
//   the letters being saved at that moment.
//
//   An unhandled rejection is a promise nobody awaited: it is logged as an
//   error with its stack, and the process keeps serving. An uncaught
//   exception means state may be broken mid-update, so it is logged as
//   fatal and the process exits for the platform to restart it cleanly.
// ═══════════════════════════════════════════════════════════════════════════
export function registerProcessLifecycle(container: AppContainer): void {
	if (registered) return

	registered = true

	const { db, redis, rootLogger } = container.cradle

	publishCloseConnections(async () => {
		rootLogger.info('Server drained; closing connections')

		await Promise.allSettled([db.$disconnect(), redis.quit()])
	})

	process.on('unhandledRejection', (reason) => {
		rootLogger.error({ err: reason }, 'Unhandled promise rejection')
	})

	process.on('uncaughtException', (error) => {
		rootLogger.fatal({ err: error }, 'Uncaught exception; exiting')
		process.exit(1)
	})
}
