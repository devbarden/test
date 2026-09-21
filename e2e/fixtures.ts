import { clerk } from '@clerk/testing/playwright'
import { test as base, type Page } from '@playwright/test'
import { Redis } from 'ioredis'
import pg from 'pg'
import {
	E2E_DATABASE_URL,
	E2E_REDIS_URL,
	e2eUserEmail,
} from './e2e-environment'

// ═══════════════════════════════════════════════════════════════════════════
//   Every test starts signed in as its worker's own user, with that user's
//   letters and rate-limit counters wiped — and with empty browser storage,
//   since each test gets a fresh browser context.
// ═══════════════════════════════════════════════════════════════════════════
export const test = base.extend<{ page: Page }>({
	page: async ({ page }, use, testInfo) => {
		await signIn(page, testInfo.parallelIndex)
		await resetUser(await currentUserId(page))
		await use(page)
	},
})

export { expect } from '@playwright/test'

export async function signIn(page: Page, workerIndex: number) {
	await page.goto('/sign-in')
	await clerk.signIn({
		page,
		signInParams: {
			identifier: e2eUserEmail(workerIndex),
			strategy: 'email_code',
		},
	})
}

async function currentUserId(page: Page): Promise<string> {
	await page.waitForFunction(() => Boolean(window.Clerk?.user?.id))

	return page.evaluate(() => window.Clerk?.user?.id ?? '')
}

async function resetUser(userId: string) {
	const db = new pg.Client({ connectionString: E2E_DATABASE_URL })
	const redis = new Redis(E2E_REDIS_URL)

	try {
		await db.connect()
		await db.query('DELETE FROM applications WHERE user_id = $1', [userId])

		const keys = [
			...(await redis.keys(`rl:*:${userId}`)),
			...(await redis.keys('rl:upstream:*')),
			`lock:generation:${userId}`,
		]

		await redis.del(...keys)
	} finally {
		await db.end()
		redis.disconnect()
	}
}

export const LETTER_LINE =
	'I am writing to express my interest in the Product manager position.'

export async function fillApplication(
	page: Page,
	skills = 'HTML, CSS and doing things in time',
) {
	await page.getByLabel('Job title').fill('Product manager')
	await page.getByLabel('Company').fill('Apple')
	await page.getByLabel('I am good at...').fill(skills)
}

export async function generateLetter(page: Page) {
	await page.goto('/applications/new')
	await fillApplication(page)
	await page.getByRole('button', { name: 'Generate Now' }).click()
	await page.waitForURL(/\/applications\/[0-9a-f-]{36}$/)
}
