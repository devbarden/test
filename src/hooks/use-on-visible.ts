import { useEffect, useEffectEvent, useState } from 'react'

// ═══════════════════════════════════════════════════════════════════════════
//   Calls `onVisible` when the element given to the returned ref comes
//   within `rootMargin` of the viewport. An observer reports only changes,
//   so an element that is already in view after the callback ran never
//   fires again; the caller unmounts it while it works and mounts a fresh
//   one after, and the new observer reports it at once if it is still in
//   view — which is what keeps an infinite list loading until it fills
//   the screen.
// ═══════════════════════════════════════════════════════════════════════════
export function useOnVisible(onVisible: () => void, rootMargin = '0px') {
	const [target, setTarget] = useState<Element | null>(null)
	const notify = useEffectEvent(onVisible)

	useEffect(() => {
		if (!target) return

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) notify()
			},
			{ rootMargin },
		)

		observer.observe(target)

		return () => observer.disconnect()
	}, [rootMargin, target])

	return setTarget
}
