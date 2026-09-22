import { useEffect, useEffectEvent, useState } from 'react'

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
