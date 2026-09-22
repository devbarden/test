type StreamWatchdogOptions = {
	idleTimeoutMs: number
	maxDurationMs: number
	signal: AbortSignal
}

// ═══════════════════════════════════════════════════════════════════════════
//   The idle limit is shorter than the browser's 60 s: a stalled provider
//   must fail here, as our error with a quota refund, not look like the
//   user leaving. The ceiling keeps a run under the generation lock's TTL.
// ═══════════════════════════════════════════════════════════════════════════
export function createStreamWatchdog({ idleTimeoutMs, maxDurationMs, signal }: StreamWatchdogOptions) {
	const controller = new AbortController()
	const expire = (reason: string) => controller.abort(new DOMException(reason, 'TimeoutError'))
	const ceiling = setTimeout(() => expire('Generation took too long'), maxDurationMs)
	let idle: ReturnType<typeof setTimeout> | undefined

	const feed = () => {
		clearTimeout(idle)
		idle = setTimeout(() => expire('No data'), idleTimeoutMs)
	}

	const stop = () => {
		clearTimeout(idle)
		clearTimeout(ceiling)
	}

	feed()

	return { feed, signal: AbortSignal.any([signal, controller.signal]), stop }
}

export type StreamWatchdog = ReturnType<typeof createStreamWatchdog>
