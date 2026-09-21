import { STACKED_LAYOUT_QUERY } from '@/lib/breakpoints'

// ═══════════════════════════════════════════════════════════════════════════
//   Below the two-column breakpoint the letter sits under the form, off
//   screen on a phone at the moment "Generate Now" is tapped. Without this
//   the user would see a spinner on the button and nothing else happening.
// ═══════════════════════════════════════════════════════════════════════════
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
