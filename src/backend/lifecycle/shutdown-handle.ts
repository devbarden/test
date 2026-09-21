// ═══════════════════════════════════════════════════════════════════════════
//   The hand-off between two bundles. Nitro runs its runtime plugins (and
//   their `close` hook) in its own bundle, while the app — the container,
//   its Postgres pool and Redis client — lives in the SSR bundle. A plugin
//   that imported the container would get a SECOND copy of it and close
//   connections nobody uses. So the app publishes how to close its own
//   connections under a registry symbol, which is the same value in every
//   bundle, and the plugin calls whatever is published there.
// ═══════════════════════════════════════════════════════════════════════════
const CLOSE_CONNECTIONS = Symbol.for('alt-shift.close-connections')

type Holder = { [CLOSE_CONNECTIONS]?: () => Promise<void> }

export function publishCloseConnections(close: () => Promise<void>): void {
	;(globalThis as Holder)[CLOSE_CONNECTIONS] = close
}

export async function closePublishedConnections(): Promise<void> {
	await (globalThis as Holder)[CLOSE_CONNECTIONS]?.()
}
