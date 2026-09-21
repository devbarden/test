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
		expect(change('/', '/applications')).toEqual(['page', 'forward'])
		expect(change('/applications', '/applications/new')).toEqual([
			'page',
			'forward',
		])
	})

	it('slides back up to a shallower page', () => {
		expect(change('/applications/abc', '/applications')).toEqual([
			'page',
			'back',
		])
	})

	it('cross-fades between sections of the same depth', () => {
		expect(change('/sign-in', '/applications')).toEqual(['page'])
	})

	it('cross-fades between siblings of one section', () => {
		expect(change('/applications/new', '/applications/billing')).toEqual([
			'page',
		])
	})

	it('does not animate the first load or a search-only change', () => {
		expect(change(undefined, '/applications')).toBe(false)
		expect(change('/applications', '/applications')).toBe(false)
	})
})
