// ═══════════════════════════════════════════════════════════════════════════
//   Where application-editor.module.css stacks the letter under the form.
// ═══════════════════════════════════════════════════════════════════════════
const STACKED_LAYOUT_QUERY = '(width < 60rem)'

export function scrollIntoViewIfStacked(element: HTMLElement | null) {
	if (!element || !window.matchMedia(STACKED_LAYOUT_QUERY).matches) return

	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

	element.scrollIntoView({
		behavior: reduceMotion ? 'auto' : 'smooth',
		block: 'start',
	})
}
