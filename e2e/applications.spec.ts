import {
	expect,
	fillApplication,
	LETTER,
	mockGeneration,
	test,
} from './fixtures'

test('an empty dashboard invites the user to create the first letter', async ({
	page,
}) => {
	await page.goto('/')

	await expect(
		page.getByRole('heading', { name: 'No applications yet' }),
	).toBeVisible()
	await expect(
		page.getByRole('progressbar', { name: '0 of 5 applications generated' }),
	).toBeVisible()
})

test('generates a letter, saves it and restores it after a reload', async ({
	page,
}) => {
	await mockGeneration(page)
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
	await expect(page.getByText(LETTER[1] ?? '')).toBeVisible()
	await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible()

	await page.reload()
	await expect(page.getByText(LETTER[1] ?? '')).toBeVisible()

	await page.goto('/')
	await expect(page.getByRole('listitem')).toHaveCount(1)
	await expect(page.getByText('1/5')).toBeVisible()
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

test('shows why a generation was refused and saves nothing', async ({
	page,
}) => {
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
	await expect(page.getByText('0/5')).toBeVisible()
})

test('deletes a letter and brings it back with Undo', async ({ page }) => {
	await mockGeneration(page)
	await page.goto('/applications/new')
	await fillApplication(page)
	await page.getByRole('button', { name: 'Generate Now' }).click()
	await expect(page).toHaveURL(/\/applications\/[0-9a-f-]{36}$/)

	await page.goto('/')
	await page.getByRole('button', { name: 'Delete' }).click()
	await expect(
		page.getByRole('heading', { name: 'No applications yet' }),
	).toBeVisible()

	await page.getByRole('button', { name: 'Undo' }).click()
	await expect(page.getByRole('listitem')).toHaveCount(1)
})
