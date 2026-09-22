import type { AppContainer } from '../di/container.server'
import { publishCloseConnections } from './shutdown-handle'

let registered = false

// ═══════════════════════════════════════════════════════════════════════════
//   Connections close in Nitro's `close` hook, after draining: closing on
//   SIGTERM failed in-flight saves.
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
