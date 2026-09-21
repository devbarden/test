// ═══════════════════════════════════════════════════════════════════════════
//   Nitro plugins run in their own bundle; a registry symbol reaches the
//   app's one container.
// ═══════════════════════════════════════════════════════════════════════════
const CLOSE_CONNECTIONS = Symbol.for('alt-shift.close-connections')

type Holder = { [CLOSE_CONNECTIONS]?: () => Promise<void> }

export function publishCloseConnections(close: () => Promise<void>): void {
	;(globalThis as Holder)[CLOSE_CONNECTIONS] = close
}

export async function closePublishedConnections(): Promise<void> {
	await (globalThis as Holder)[CLOSE_CONNECTIONS]?.()
}
