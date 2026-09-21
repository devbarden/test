import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

// ═══════════════════════════════════════════════════════════════════════════
//   Two projects with different contracts. `unit` touches no network and no
//   database and runs everywhere. `integration` runs against the real
//   Postgres and Redis from docker compose, one file at a time, because its
//   files share one database and truncate it between tests.
// ═══════════════════════════════════════════════════════════════════════════
export default defineConfig({
	plugins: [tsconfigPaths({ projects: ['./tsconfig.json'] })],
	test: {
		projects: [
			{
				extends: true,
				test: {
					environment: 'node',
					exclude: ['src/**/*.integration.test.ts'],
					include: ['src/**/*.test.{ts,tsx}'],
					name: 'unit',
				},
			},
			{
				extends: true,
				test: {
					environment: 'node',
					fileParallelism: false,
					globalSetup: ['./src/test/integration/global-setup.ts'],
					include: ['src/**/*.integration.test.ts'],
					name: 'integration',
					testTimeout: 20_000,
				},
			},
		],
	},
})
