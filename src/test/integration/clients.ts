import { PrismaPg } from '@prisma/adapter-pg'
import { Redis } from 'ioredis'
import { afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '@/generated/prisma/client'
import {
	assertDisposable,
	TEST_DATABASE_URL,
	TEST_REDIS_URL,
} from './environment'

export function setupTestDatabase(): PrismaClient {
	assertDisposable(TEST_DATABASE_URL)

	const db = new PrismaClient({
		adapter: new PrismaPg({ connectionString: TEST_DATABASE_URL }),
	})

	beforeEach(async () => {
		await db.$executeRaw`TRUNCATE TABLE applications`
	})

	afterAll(() => db.$disconnect())

	return db
}

export function setupTestRedis(): Redis {
	assertDisposable(TEST_REDIS_URL)

	const redis = new Redis(TEST_REDIS_URL, { maxRetriesPerRequest: 1 })

	beforeEach(async () => {
		await redis.flushdb()
	})

	afterAll(async () => {
		await redis.quit()
	})

	return redis
}
