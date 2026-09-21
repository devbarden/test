import { execFileSync } from 'node:child_process'
import { assertDisposable, TEST_DATABASE_URL } from './environment'

export default function migrateTestDatabase() {
	assertDisposable(TEST_DATABASE_URL)

	execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
		env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
		stdio: 'ignore',
	})
}
