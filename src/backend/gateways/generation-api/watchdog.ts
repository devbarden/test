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
