import { BREAK_MIDSTREAM } from './e2e-environment'
import {
	expect,
	fillApplication,
	generateLetter,
	LETTER_LINE,
	signIn,
	test,
} from './fixtures'

test('an empty dashboard invites the user to create the first letter', async ({
	page,
}) => {
	await page.goto('/applications')

	await expect(
		page.getByRole('heading', { name: 'No applications yet' }),
	).toBeVisible()
	await expect(
		page.getByRole('progressbar', { name: '0 of 5 applications generated' }),
	).toBeVisible()
})

test('streams a letter, saves it on the server and opens it by its own URL', async ({
	page,
}) => {
	await page.goto('/applications/new')

	await expect(
		page.getByRole('heading', { name: 'New application' }),
	).toBeVisible()
	await expect(
		page.getByRole('button', { name: 'Generate Now' }),
	).toBeDisabled()

	await fillApplication(page)
	await expect(
		page.getByRole('heading', { name: 'Product manager, Apple' }),
	).toBeVisible()
	await page.getByRole('button', { name: 'Generate Now' }).click()

	await expect(page).toHaveURL(/\/applications\/[0-9a-f-]{36}$/)
	await expect(page.getByText(LETTER_LINE)).toBeVisible()
	await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible()

	await page.reload()
	await expect(page.getByText(LETTER_LINE)).toBeVisible()
})

test('shows the letter in another browser, from the server', async ({
	browser,
	page,
}, testInfo) => {
	await generateLetter(page)

	const otherBrowser = await browser.newContext()
	const otherPage = await otherBrowser.newPage()

	await signIn(otherPage, testInfo.parallelIndex)
	await otherPage.goto('/applications')

	await expect(otherPage.getByRole('listitem')).toHaveCount(1)
	await expect(otherPage.getByText('1/5')).toBeVisible()

	await otherBrowser.close()
})

test('restores letters from browser storage when the API cannot be reached', async ({
	page,
}) => {
	await generateLetter(page)
	await page.goto('/applications')
	await expect(page.getByRole('listitem')).toHaveCount(1)
	await page.waitForFunction(() =>
		Object.entries(localStorage).some(
			([key, value]) =>
				key.startsWith('alt-shift:cache:') && value.includes('"list"'),
		),
	)

	await page.route('**/_serverFn/**', (route) => route.abort())
	await page.reload()

	await expect(page.getByRole('listitem')).toHaveCount(1)
	await expect(page.getByText('Dear Apple Team,')).toBeVisible()
})

test('keeps Generate Now disabled while the details are over the limit', async ({
	page,
}) => {
	await page.goto('/applications/new')
	await fillApplication(page)

	await page.getByLabel('Additional details').fill('a'.repeat(1201))

	await expect(page.getByText('1201/1200')).toBeVisible()
	await expect(page.getByLabel('Additional details')).toHaveAttribute(
		'aria-invalid',
		'true',
	)
	await expect(
		page.getByRole('button', { name: 'Generate Now' }),
	).toBeDisabled()
})

test('saves nothing when the letter breaks off mid-stream', async ({
	page,
}) => {
	await page.goto('/applications/new')
	await fillApplication(page, `HTML ${BREAK_MIDSTREAM}`)
	await page.getByRole('button', { name: 'Generate Now' }).click()

	await expect(page.getByRole('alert')).toContainText('connection dropped')
	await expect(page).toHaveURL(/\/applications\/new$/)

	await page.goto('/applications')
	await expect(
		page.getByRole('heading', { name: 'No applications yet' }),
	).toBeVisible()
})

test('explains a refused generation with its retry time', async ({ page }) => {
	await page.route('**/api/generate', (route) =>
		route.fulfill({
			json: { error: { code: 'rate_limited', retryAfterSeconds: 14 } },
			status: 429,
		}),
	)
	await page.goto('/applications/new')
	await fillApplication(page)
	await page.getByRole('button', { name: 'Generate Now' }).click()

	await expect(page.getByRole('alert')).toContainText('Try again in 14 seconds')
	await expect(page).toHaveURL(/\/applications\/new$/)
})

test('deletes a letter and brings it back with Undo, on the server too', async ({
	page,
}) => {
	await generateLetter(page)
	await page.goto('/applications')

	await page.getByRole('button', { name: 'Delete' }).click()
	await expect(
		page.getByRole('heading', { name: 'No applications yet' }),
	).toBeVisible()

	await page.getByRole('button', { name: 'Undo' }).click()
	await expect(page.getByRole('listitem')).toHaveCount(1)

	await page.reload()
	await expect(page.getByRole('listitem')).toHaveCount(1)
})
