import { describe, expect, it } from 'vitest'
import { splitByTerms } from './text-parts'

describe('splitByTerms', () => {
	it('marks every case-insensitive occurrence, in order', () => {
		expect(splitByTerms('Dear Apple team, apple pie', ['APPLE'])).toEqual([
			{ isMatch: false, text: 'Dear ' },
			{ isMatch: true, text: 'Apple' },
			{ isMatch: false, text: ' team, ' },
			{ isMatch: true, text: 'apple' },
			{ isMatch: false, text: ' pie' },
		])
	})

	it('prefers the longer term and treats terms literally', () => {
		expect(splitByTerms('manager', ['man', 'manager'])).toEqual([
			{ isMatch: true, text: 'manager' },
		])
		expect(splitByTerms('C++ (PM) role', ['c++', '(pm)'])).toEqual([
			{ isMatch: true, text: 'C++' },
			{ isMatch: false, text: ' ' },
			{ isMatch: true, text: '(PM)' },
			{ isMatch: false, text: ' role' },
		])
	})

	it('returns the text whole when there is nothing to find', () => {
		expect(splitByTerms('Hello', [' ', ''])).toEqual([
			{ isMatch: false, text: 'Hello' },
		])
		expect(splitByTerms('', ['a'])).toEqual([])
	})
})
