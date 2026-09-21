import { BREAK_MIDSTREAM } from './e2e-environment'
import {
	addLetters,
	currentUser,
	expect,
	fillApplication,
	generateLetter,
	LETTER_LINE,
	signIn,
	spendDailyLetters,
	test,
} from './fixtures'

test('an empty dashboard invites the user to create the first letter', async ({
	page,
}) => {
	await page.goto('/app/applications')

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
	await page.goto('/app/applications/create')

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

	await expect(page).toHaveURL(/\/app\/applications\/[0-9a-f-]{36}$/)
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
	await otherPage.goto('/app/applications')

	await expect(otherPage.getByRole('listitem')).toHaveCount(1)
	await expect(
		otherPage.getByRole('progressbar', { name: '1/5 applications generated' }),
	).toBeVisible()

	await otherBrowser.close()
})

test('restores letters from browser storage when the API cannot be reached', async ({
	page,
}) => {
	await generateLetter(page)
	await page.goto('/app/applications')
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
	await page.goto('/app/applications/create')
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
	await page.goto('/app/applications/create')
	await fillApplication(page, `HTML ${BREAK_MIDSTREAM}`)
	await page.getByRole('button', { name: 'Generate Now' }).click()

	await expect(page.getByRole('alert')).toContainText('connection dropped')
	await expect(page).toHaveURL(/\/app\/applications\/create$/)

	await page.goto('/app/applications')
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
	await page.goto('/app/applications/create')
	await fillApplication(page)
	await page.getByRole('button', { name: 'Generate Now' }).click()

	await expect(page.getByRole('alert')).toContainText('Try again in 14 seconds')
	await expect(page).toHaveURL(/\/app\/applications\/create$/)
})

test('deletes a letter and brings it back with Undo, on the server too', async ({
	page,
}) => {
	await generateLetter(page)
	await page.goto('/app/applications')

	await page.getByRole('button', { name: 'Delete' }).click()

	const dialog = page.getByRole('dialog', { name: 'Delete this application?' })

	await expect(dialog).toContainText('“Product manager, Apple”')
	await dialog.getByRole('button', { name: 'Delete' }).click()
	await expect(dialog).toBeHidden()
	await expect(
		page.getByRole('heading', { name: 'No applications yet' }),
	).toBeVisible()

	await page.getByRole('button', { name: 'Undo' }).click()
	await expect(page.getByRole('listitem')).toHaveCount(1)

	await page.reload()
	await expect(page.getByRole('listitem')).toHaveCount(1)
})

test('keeps a letter when the delete is cancelled', async ({ page }) => {
	await generateLetter(page)
	await page.goto('/app/applications')

	await page.getByRole('button', { name: 'Delete' }).click()
	await expect(page.getByRole('dialog')).toBeVisible()
	await expect(page.getByRole('button', { name: 'Cancel' })).toBeFocused()
	await page.keyboard.press('Escape')

	await expect(page.getByRole('dialog')).toBeHidden()
	await expect(page.getByRole('button', { name: 'Delete' })).toBeFocused()
	await page.reload()
	await expect(page.getByRole('listitem')).toHaveCount(1)
})

test('searches letters by job title and company, and keeps it in the URL', async ({
	page,
}) => {
	await generateLetter(page)
	await page.goto('/app/applications/create')
	await page.getByLabel('Job title').fill('Designer')
	await page.getByLabel('Company').fill('Google')
	await page.getByLabel('I am good at...').fill('Figma')
	await page.getByRole('button', { name: 'Generate Now' }).click()
	await page.waitForURL(/\/app\/applications\/[0-9a-f-]{36}$/)
	await page.goto('/app/applications')
	await expect(page.getByRole('listitem')).toHaveCount(2)

	const search = page.getByRole('searchbox', { name: 'Search applications' })

	await search.fill('apple MANAGER')
	await expect(page).toHaveURL(/\?q=apple\+MANAGER$/)
	await expect(page.getByRole('listitem')).toHaveCount(1)
	await expect(page.getByRole('listitem')).toContainText(
		'I am writing to express my interest in the Product manager position.',
	)

	await expect(page.getByRole('listitem').locator('mark')).toHaveText([
		'Apple',
		'manager',
	])

	await search.fill('nobody')
	await expect(
		page.getByRole('heading', { name: 'Nothing found' }),
	).toBeVisible()

	await page.reload()
	await expect(search).toHaveValue('nobody')
	await page.getByRole('button', { name: 'Clear search' }).first().click()
	await expect(page).toHaveURL(/\/app\/applications$/)
	await expect(page.getByRole('listitem')).toHaveCount(2)
})

test('loads the next page of letters as the list scrolls', async ({ page }) => {
	await generateLetter(page)
	await addLetters(await currentUser(page), 29)
	await page.goto('/app/applications')

	const cards = page.getByRole('listitem')

	await expect(cards).toHaveCount(10)
	await expect(async () => {
		await cards.last().scrollIntoViewIfNeeded()
		await expect(cards).toHaveCount(30, { timeout: 1000 })
	}).toPass()
})

test('explains a spent daily allowance in a dialog that leads to the plans', async ({
	page,
}) => {
	await generateLetter(page)
	await spendDailyLetters(await currentUser(page))
	await page.reload()

	await page.getByRole('button', { name: 'Try Again' }).click()

	const dialog = page.getByRole('dialog', {
		name: 'Today’s letters are used up',
	})

	await expect(dialog).toContainText('10 letters a day')
	await dialog.getByRole('link', { name: 'See plans' }).click()
	await expect(page).toHaveURL(/\/app\/billing$/)
})

test('opens the workspace at /app and sends old addresses to their new ones', async ({
	page,
}) => {
	await page.goto('/app')
	await expect(page).toHaveURL(/\/app\/applications$/)

	await page.goto('/applications/new')
	await expect(page).toHaveURL(/\/app\/applications\/create$/)

	await page.goto('/applications/billing')
	await expect(page).toHaveURL(/\/app\/billing$/)

	await page.goto('/applications?q=apple')
	await expect(page).toHaveURL(/\/app\/applications\?q=apple$/)
})
