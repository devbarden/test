import { existsSync } from 'node:fs'
import { defineConfig } from 'prisma/config'

if (existsSync('.env')) process.loadEnvFile('.env')

// ═══════════════════════════════════════════════════════════════════════════
//   The URL is only needed by commands that talk to a database (migrate,
//   studio). `prisma generate` runs at install and build time, where no
//   database exists, so a missing variable must not fail it.
// ═══════════════════════════════════════════════════════════════════════════
export default defineConfig({
	datasource: { url: process.env.DATABASE_URL ?? '' },
	migrations: { path: 'prisma/migrations' },
	schema: 'prisma/schema.prisma',
})
