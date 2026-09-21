import { STACKED_LAYOUT_QUERY } from '@/lib/breakpoints'

export function scrollIntoViewIfStacked(element: HTMLElement | null) {
	if (!element || !window.matchMedia(STACKED_LAYOUT_QUERY).matches) return

	const reduceMotion = window.matchMedia(
		'(prefers-reduced-motion: reduce)',
	).matches

	element.scrollIntoView({
		behavior: reduceMotion ? 'auto' : 'smooth',
		block: 'start',
	})
}
