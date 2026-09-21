import { describe, expect, it } from 'vitest'
import { isLocalizablePath } from '../i18n/localized-routes'
import { generateRobotsTxt, generateSitemap } from './robots-and-sitemap'

function groups(robots: string): string[][] {
	return robots
		.split(/\n\s*\n/)
		.map((block) => block.split('\n').filter((line) => !line.startsWith('#')))
		.filter((lines) => lines.some((line) => line.startsWith('User-agent:')))
}

describe('robots.txt', () => {
	it('repeats every Disallow in the AI crawler group', () => {
		const [everyone, aiCrawlers] = groups(generateRobotsTxt())
		const disallowed = (lines: string[] = []) =>
			lines.filter((line) => line.startsWith('Disallow:'))

		expect(disallowed(everyone)).toContain('Disallow: /applications/')
		expect(disallowed(aiCrawlers)).toEqual(disallowed(everyone))
		expect(aiCrawlers).toContain('User-agent: ClaudeBot')
	})

	it('never blocks sign-in, whose noindex must stay readable', () => {
		expect(generateRobotsTxt()).not.toMatch(/Disallow: \/sign-in/)
	})

	it('points at the sitemap', () => {
		expect(generateRobotsTxt()).toMatch(/^Sitemap: .+\/sitemap\.xml$/m)
	})
})

describe('sitemap.xml', () => {
	it('lists the landing once per language with a reciprocal cluster', () => {
		const sitemap = generateSitemap()
		const entries = sitemap.split('<url>').slice(1)

		expect(entries).toHaveLength(2)
		for (const entry of entries) {
			expect(entry).toMatch(/hreflang="en"/)
			expect(entry).toMatch(/hreflang="ru"/)
			expect(entry).toMatch(/hreflang="x-default"/)
		}
		expect(sitemap).toMatch(/<loc>[^<]+\/ru\/<\/loc>/)
	})

	it('never lists the private app', () => {
		expect(generateSitemap()).not.toMatch(/applications|sign-in/)
	})
})

describe('localized routes', () => {
	it('localizes the public pages only', () => {
		expect(isLocalizablePath('/')).toBe(true)
		expect(isLocalizablePath('/applications')).toBe(false)
		expect(isLocalizablePath('/applications/new')).toBe(false)
		expect(isLocalizablePath('/sign-in/factor-one')).toBe(false)
		expect(isLocalizablePath('/api/generate')).toBe(false)
	})
})
