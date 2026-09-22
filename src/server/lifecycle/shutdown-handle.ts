// ═══════════════════════════════════════════════════════════════════════════
//   Nitro plugins run in their own bundle; a global reaches the app's one
//   container from there.
// ═══════════════════════════════════════════════════════════════════════════
declare global {
	var __altShiftCloseConnections: (() => Promise<void>) | undefined
}

export function publishCloseConnections(close: () => Promise<void>): void {
	globalThis.__altShiftCloseConnections = close
}

export async function closePublishedConnections(): Promise<void> {
	await globalThis.__altShiftCloseConnections?.()
}
