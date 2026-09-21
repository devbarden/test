import { describe, expect, it } from 'vitest'
import {
	matchesSearch,
	normalizeSearch,
	searchTerms,
} from './application-search'

const letter = { company: 'Apple', jobTitle: 'Product Manager' }

describe('application search', () => {
	it('splits a search into lower-case words, at most six', () => {
		expect(searchTerms('  Product   MANAGER ')).toEqual(['product', 'manager'])
		expect(searchTerms('a b c d e f g h')).toHaveLength(6)
		expect(normalizeSearch('  Apple\tPM ')).toBe('apple pm')
	})

	it('matches when every word is in the job title or the company', () => {
		expect(matchesSearch(letter, 'apple manager')).toBe(true)
		expect(matchesSearch(letter, 'APP')).toBe(true)
		expect(matchesSearch(letter, 'apple designer')).toBe(false)
	})

	it('matches everything when the search is empty', () => {
		expect(matchesSearch(letter, '   ')).toBe(true)
	})
})
