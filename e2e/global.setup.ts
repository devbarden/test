import { clerkSetup } from '@clerk/testing/playwright'
import { test as setup } from '@playwright/test'
import { E2E_USER_EMAIL } from './fixtures'

// ═══════════════════════════════════════════════════════════════════════════
//   Clerk's testing token lets the suite past bot protection on a
//   development instance, and the test user is created on first run so a
//   fresh checkout needs nothing but the two Clerk keys. The address uses
//   Clerk's `+clerk_test` convention: no email is ever sent, and the
//   verification code is always 424242. The instance requires a password
//   on creation, so the user gets a random one it never uses: tests sign in
//   with the email code.
// ═══════════════════════════════════════════════════════════════════════════
setup('configure Clerk and the test user', async () => {
	process.env.CLERK_PUBLISHABLE_KEY ??= process.env.VITE_CLERK_PUBLISHABLE_KEY

	await clerkSetup({ dotenv: false })
	await ensureTestUser(E2E_USER_EMAIL)
})

async function ensureTestUser(email: string) {
	const api = 'https://api.clerk.com/v1/users'
	const headers = {
		Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
		'Content-Type': 'application/json',
	}
	const existing = await fetch(
		`${api}?email_address=${encodeURIComponent(email)}`,
		{ headers },
	).then((response) => response.json() as Promise<unknown[]>)

	if (existing.length > 0) return

	const created = await fetch(api, {
		body: JSON.stringify({
			email_address: [email],
			password: crypto.randomUUID(),
			skip_password_checks: true,
		}),
		headers,
		method: 'POST',
	})

	if (!created.ok)
		throw new Error(`Could not create the e2e user: ${await created.text()}`)
}
