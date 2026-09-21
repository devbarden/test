import { clerk } from '@clerk/testing/playwright'
import { test as base, type Page } from '@playwright/test'

export const E2E_USER_EMAIL = 'e2e+clerk_test@example.com'

// ═══════════════════════════════════════════════════════════════════════════
//   Every test starts signed in with EMPTY storage. Tests run in parallel as
//   the same Clerk user, but each gets its own browser context and so its
//   own localStorage — they cannot see each other's letters.
// ═══════════════════════════════════════════════════════════════════════════
export const test = base.extend<{ page: Page }>({
	page: async ({ page }, use) => {
		await page.goto('/sign-in')
		await clerk.signIn({
			page,
			signInParams: { identifier: E2E_USER_EMAIL, strategy: 'email_code' },
		})
		await use(page)
	},
})

export { expect } from '@playwright/test'

export const LETTER = [
	'Dear Apple Team,',
	'I am writing to express my interest in the Product Manager position.',
	'Thank you for considering my application.',
]

// ═══════════════════════════════════════════════════════════════════════════
//   Answers /api/generate the way the real route does — NDJSON, one event
//   per line, an explicit `done` — so the UI is exercised end to end without
//   spending the shared upstream rate limit or depending on what the model
//   happens to write.
// ═══════════════════════════════════════════════════════════════════════════
export async function mockGeneration(page: Page, letter = LETTER.join('\n\n')) {
	const words = letter.split(/(?<= )/)
	const body = [
		...words.map((text) => JSON.stringify({ text, type: 'delta' })),
		JSON.stringify({ type: 'done' }),
	].join('\n')

	await page.route('**/api/generate', (route) =>
		route.fulfill({ body, contentType: 'application/x-ndjson', status: 200 }),
	)
}

export async function fillApplication(page: Page) {
	await page.getByLabel('Job title').fill('Product manager')
	await page.getByLabel('Company').fill('Apple')
	await page
		.getByLabel('I am good at...')
		.fill('HTML, CSS and doing things in time')
}
