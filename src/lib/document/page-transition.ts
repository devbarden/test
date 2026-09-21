type LocationChange = {
	fromLocation?: { pathname: string }
	pathChanged: boolean
	toLocation: { pathname: string }
}

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
