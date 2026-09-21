// ═══════════════════════════════════════════════════════════════════════════
//   An AbortSignal that fires if nobody re-arms it in time. Used twice for
//   one request: first as a time-to-first-byte limit, then — re-armed on
//   every event — as an inactivity limit. A total-duration timeout would be
//   wrong here: a long letter that keeps streaming is healthy; a stream
//   that goes silent is not.
// ═══════════════════════════════════════════════════════════════════════════
export function createWatchdog() {
	const controller = new AbortController()
	let timer: ReturnType<typeof setTimeout> | undefined

	return {
		arm(timeoutMs: number) {
			clearTimeout(timer)
			timer = setTimeout(
				() =>
					controller.abort(
						new DOMException(`No data for ${timeoutMs} ms`, 'TimeoutError'),
					),
				timeoutMs,
			)
		},
		disarm() {
			clearTimeout(timer)
		},
		signal: controller.signal,
	}
}

export type Watchdog = ReturnType<typeof createWatchdog>
