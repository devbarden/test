// ═══════════════════════════════════════════════════════════════════════════
//   Namespaced by user: two people signing in on the same browser (a shared
//   laptop, a reviewer with two test accounts) must never see each other's
//   letters. The version lives INSIDE the document rather than in the key,
//   so a future migration can read the old shape instead of orphaning it.
// ═══════════════════════════════════════════════════════════════════════════
export function applicationsStorageKey(userId: string): string {
	return `alt-shift:applications:${userId}`
}
