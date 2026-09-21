import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

if (existsSync('.env')) process.loadEnvFile('.env')

const PORT = 3000

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
		baseURL: `http://localhost:${PORT}`,
		trace: 'retain-on-failure',
	},
	webServer: {
		command: `npm run dev -- --port ${PORT}`,
		reuseExistingServer: !process.env.CI,
		url: `http://localhost:${PORT}/api/health`,
	},
})
