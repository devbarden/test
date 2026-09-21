import { definePlugin } from 'nitro'
import { createAppConfig } from '../config.server'
import { closePublishedConnections } from './shutdown-handle'

// ═══════════════════════════════════════════════════════════════════════════
//   The two moments of the server's life that no request sees. Nitro runs
//   this plugin at startup, in its own bundle — the app itself is loaded
//   lazily, by the first request.
//
//   Boot: the environment is parsed HERE, so a deploy with a missing or
//   malformed variable crashes before it listens, with the reason in the
//   deploy log. Left to the app, the process would come up and answer
//   every request with a 500. Parsing twice is harmless: it is pure.
//
//   Shutdown: Nitro calls `close` on SIGTERM / SIGINT only AFTER the HTTP
//   server has stopped accepting and drained its in-flight requests. That
//   is the one moment the Postgres pool and the Redis connection can go:
//   earlier, a letter still streaming would fail to save; never, and their
//   open sockets would keep the process alive until the platform kills it.
// ═══════════════════════════════════════════════════════════════════════════
export default definePlugin((nitroApp) => {
	createAppConfig()

	nitroApp.hooks.hook('close', closePublishedConnections)
})
