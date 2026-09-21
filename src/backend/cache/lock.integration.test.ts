import { describe, expect, it } from 'vitest'
import { silentLogger } from '@/test/fixtures'
import { useTestRedis } from '@/test/integration/clients'
import { createLockService } from './lock.server'

const redis = useTestRedis()
const locks = createLockService({ redis, rootLogger: silentLogger })

describe('lockService (Redis)', () => {
	it('grants one holder at a time and frees the key on release', async () => {
		const first = await locks.acquire('lock:test', 5_000)

		expect(first).not.toBeNull()
		expect(await locks.acquire('lock:test', 5_000)).toBeNull()

		await first?.release()

		expect(await locks.acquire('lock:test', 5_000)).not.toBeNull()
	})

	it('never releases a lock that has since been taken by someone else', async () => {
		const stale = await locks.acquire('lock:test', 50)

		await new Promise((resolve) => setTimeout(resolve, 100))

		const current = await locks.acquire('lock:test', 5_000)

		await stale?.release()

		expect(current).not.toBeNull()
		expect(await locks.acquire('lock:test', 5_000)).toBeNull()
	})
})
