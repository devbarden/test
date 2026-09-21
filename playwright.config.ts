import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'
import {
	E2E_APP_PORT,
	E2E_SERVER_ENV,
	E2E_WORKERS,
	FAKE_GENERATION_API_PORT,
} from './e2e/e2e-environment'

if (existsSync('.env')) process.loadEnvFile('.env')

// ═══════════════════════════════════════════════════════════════════════════
//   The suite runs against the production build, as Railway serves it: the
//   dev server's on-demand dependency optimisation reloads pages mid-test,
//   and a bug that only exists in the bundled output would slip through.
// ═══════════════════════════════════════════════════════════════════════════
export default defineConfig({
	forbidOnly: Boolean(process.env.CI),
	fullyParallel: true,
	projects: [
		{ name: 'setup', testMatch: /global\.setup\.ts/ },
		{
			dependencies: ['setup'],
			name: 'desktop',
			use: { ...devices['Desktop Chrome'] },
		},
		{
			dependencies: ['setup'],
			name: 'mobile',
			use: { ...devices['Pixel 7'] },
		},
	],
	reporter: process.env.CI ? 'github' : 'list',
	retries: process.env.CI ? 2 : 0,
	testDir: './e2e',
	use: {
		baseURL: `http://localhost:${E2E_APP_PORT}`,
		trace: 'retain-on-failure',
	},
	webServer: [
		{
			command: 'node e2e/fake-generation-api.ts',
			port: FAKE_GENERATION_API_PORT,
			reuseExistingServer: !process.env.CI,
		},
		{
			command: 'npm run build && npm start',
			env: {
				...process.env,
				...E2E_SERVER_ENV,
				PORT: String(E2E_APP_PORT),
			} as Record<string, string>,
			port: E2E_APP_PORT,
			reuseExistingServer: !process.env.CI,
			timeout: 180_000,
		},
	],
	workers: E2E_WORKERS,
})
