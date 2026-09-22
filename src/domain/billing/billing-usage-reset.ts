const SECONDS_PER_HOUR = 3600

// ═══════════════════════════════════════════════════════════════════════════
//   Rounded up and never zero: "resets in 0 h" reads as "now" while the
//   limit still holds.
// ═══════════════════════════════════════════════════════════════════════════
export function hoursUntilReset(seconds: number): number {
	return Math.max(1, Math.ceil(seconds / SECONDS_PER_HOUR))
}
