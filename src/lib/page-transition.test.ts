import { describe, expect, it } from 'vitest'
import { pageTransitionTypes } from './page-transition'

function change(from: string | undefined, to: string) {
	return pageTransitionTypes({
		fromLocation: from === undefined ? undefined : { pathname: from },
		pathChanged: from !== to,
		toLocation: { pathname: to },
	})
}

describe('pageTransitionTypes', () => {
	it('slides forward into a deeper page', () => {
		expect(change('/', '/app/applications')).toEqual(['page', 'forward'])
		expect(change('/app/applications', '/app/applications/create')).toEqual([
			'page',
			'forward',
		])
	})

	it('slides back up to a shallower page', () => {
		expect(change('/app/applications/abc', '/app/applications')).toEqual([
			'page',
			'back',
		])
	})

	it('cross-fades between sections of the same depth', () => {
		expect(change('/app/applications', '/app/billing')).toEqual(['page'])
	})

	it('cross-fades between siblings of one section', () => {
		expect(change('/app/applications/create', '/app/applications/abc')).toEqual(
			['page'],
		)
	})

	it('does not animate the first load or a search-only change', () => {
		expect(change(undefined, '/app/applications')).toBe(false)
		expect(change('/app/applications', '/app/applications')).toBe(false)
	})
})
