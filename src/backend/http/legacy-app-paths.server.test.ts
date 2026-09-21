import { describe, expect, it } from 'vitest'
import { legacyAppPath, legacyAppRedirect } from './legacy-app-paths.server'

describe('legacy /applications paths', () => {
	it('maps each old address to its new one', () => {
		expect(legacyAppPath('/applications')).toBe('/app/applications')
		expect(legacyAppPath('/applications/')).toBe('/app/applications')
		expect(legacyAppPath('/applications/new')).toBe('/app/applications/create')
		expect(legacyAppPath('/applications/billing')).toBe('/app/billing')
		expect(
			legacyAppPath('/applications/0190a1b2-0000-7000-8000-000000000001'),
		).toBe('/app/applications/0190a1b2-0000-7000-8000-000000000001')
	})

	it('leaves every other path alone', () => {
		expect(legacyAppPath('/app/applications')).toBeUndefined()
		expect(legacyAppPath('/applications-guide')).toBeUndefined()
		expect(legacyAppPath('/')).toBeUndefined()
	})

	it('redirects permanently and keeps the query string', () => {
		const response = legacyAppRedirect(
			new Request('https://alt-shift.test/applications?q=apple'),
		)

		expect(response?.status).toBe(301)
		expect(response?.headers.get('Location')).toBe('/app/applications?q=apple')
	})
})
