type LocationChange = {
	fromLocation?: { pathname: string }
	pathChanged: boolean
	toLocation: { pathname: string }
}

// ═══════════════════════════════════════════════════════════════════════════
//   The view-transition types of a navigation, read by global.css. `page`
//   gates every page-level rule, so an animation React starts on its own —
//   a card leaving the dashboard — never picks up the page's names. The
//   direction comes from depth: going into a letter slides forward, going
//   back up to the list slides back.
//
//   A move between pages of the same depth has no direction and only
//   cross-fades. A search-only change is the same page and does not
//   animate; nor does the editor swapping /applications/new for the saved
//   letter's own URL, which opts out at its call site (see screens/application/
//   new-application-screen.tsx).
// ═══════════════════════════════════════════════════════════════════════════
export function pageTransitionTypes({
	fromLocation,
	pathChanged,
	toLocation,
}: LocationChange): string[] | false {
	if (!fromLocation || !pathChanged) return false

	const from = depth(fromLocation.pathname)
	const to = depth(toLocation.pathname)

	if (to > from) return ['page', 'forward']
	if (to < from) return ['page', 'back']

	return ['page']
}

function depth(pathname: string): number {
	return pathname.split('/').filter(Boolean).length
}
