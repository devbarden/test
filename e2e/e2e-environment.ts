// ═══════════════════════════════════════════════════════════════════════════
//   The whole e2e stack in one place. The app under test runs on its own
//   port with its own database (alt_shift_e2e on the disposable test
//   Postgres), its own Redis database and the fake Generation API — so a
//   run never touches development data, and a development server left
//   running on :3000 is never mistaken for the one under test.
// ═══════════════════════════════════════════════════════════════════════════
export const E2E_APP_PORT = 3101
export const FAKE_GENERATION_API_PORT = 4010
export const FAKE_GENERATION_API_TOKEN = 'tok_e2e'
export const BREAK_MIDSTREAM = 'BREAK_MIDSTREAM'
export const E2E_WORKERS = 4

export const E2E_DATABASE_URL =
	'postgresql://alt_shift:alt_shift@localhost:5436/alt_shift_e2e'
export const E2E_MAINTENANCE_DATABASE_URL =
	'postgresql://alt_shift:alt_shift@localhost:5436/postgres'
export const E2E_REDIS_URL = 'redis://localhost:6380/2'

export const E2E_SERVER_ENV = {
	DATABASE_URL: E2E_DATABASE_URL,
	GENERATION_API_TOKEN: FAKE_GENERATION_API_TOKEN,
	GENERATION_API_URL: `http://localhost:${FAKE_GENERATION_API_PORT}/v1/generate`,
	REDIS_URL: E2E_REDIS_URL,
}

export function e2eUserEmail(workerIndex: number): string {
	return `e2e+w${workerIndex}+clerk_test@example.com`
}
