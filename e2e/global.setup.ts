import { execFileSync } from 'node:child_process'
import { clerkSetup } from '@clerk/testing/playwright'
import { test as setup } from '@playwright/test'
import pg from 'pg'
import {
	E2E_DATABASE_URL,
	E2E_MAINTENANCE_DATABASE_URL,
	E2E_WORKERS,
	e2eUserEmail,
} from './e2e-environment'

const DUPLICATE_DATABASE = '42P04'

// ═══════════════════════════════════════════════════════════════════════════
//   Prepares everything the suite needs, idempotently, so a fresh checkout
//   runs with nothing but `npm run db:up` and the two Clerk keys:
//
//   - the e2e database, created and migrated
//   - Clerk's testing token, which lets the suite past bot protection on a
//     development instance
//   - one Clerk user per worker, so parallel tests never share letters or
//     rate-limit buckets. The addresses use Clerk's `+clerk_test`
//     convention: no email is sent and the code is always 424242. The
//     instance requires a password on creation, so each gets a random one
//     it never uses.
// ═══════════════════════════════════════════════════════════════════════════
setup('prepare the e2e database, Clerk and test users', async () => {
	await createDatabase()

	execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
		env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
		stdio: 'ignore',
	})

	process.env.CLERK_PUBLISHABLE_KEY ??= process.env.VITE_CLERK_PUBLISHABLE_KEY

	await clerkSetup({ dotenv: false })

	for (let worker = 0; worker < E2E_WORKERS; worker += 1) {
		await ensureTestUser(e2eUserEmail(worker))
	}
})

async function createDatabase() {
	const client = new pg.Client({
		connectionString: E2E_MAINTENANCE_DATABASE_URL,
	})

	await client.connect()

	try {
		await client.query('CREATE DATABASE alt_shift_e2e')
	} catch (error) {
		if ((error as { code?: string }).code !== DUPLICATE_DATABASE) throw error
	} finally {
		await client.end()
	}
}

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

	if (!created.ok) {
		throw new Error(`Could not create the e2e user: ${await created.text()}`)
	}
}
