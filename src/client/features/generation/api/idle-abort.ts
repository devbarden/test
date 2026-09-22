export type IdleAbort = {
	restart: () => void
	signal: AbortSignal
	stop: () => void
}

// ═══════════════════════════════════════════════════════════════════════════
//   A signal that aborts when `parent` does or when `restart` has not been
//   called for `timeoutMs`. Follows `parent` by hand: AbortSignal.any is
//   missing before Safari 17.4.
// ═══════════════════════════════════════════════════════════════════════════
export function createIdleAbort(parent: AbortSignal, timeoutMs: number): IdleAbort {
	const controller = new AbortController()
	const follow = () => controller.abort(parent.reason)
	let timer: ReturnType<typeof setTimeout> | undefined

	const restart = () => {
		clearTimeout(timer)
		timer = setTimeout(() => controller.abort(), timeoutMs)
	}

	const stop = () => {
		clearTimeout(timer)
		parent.removeEventListener('abort', follow)
	}

	if (parent.aborted) follow()
	else parent.addEventListener('abort', follow, { once: true })

	restart()

	return { restart, signal: controller.signal, stop }
}
