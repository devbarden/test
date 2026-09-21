import { describe, expect, it, vi } from 'vitest'
import {
	NotFoundError,
	UnauthorizedError,
} from '@/backend/errors/app-error.server'
import { silentLogger, testConfig } from '@/test/fixtures'
import { createJobRunner } from './job-runner.server'

const SECRET = 's'.repeat(32)

function setup({ secret }: { secret?: string } = { secret: SECRET }) {
	const config = testConfig()
	const purge = vi.fn(async () => ({ purged: 3 }))

	config.cron.secret = secret

	return {
		purge,
		runner: createJobRunner({
			config,
			logger: silentLogger,
			scheduledJobs: { purge },
		}),
	}
}

describe('jobRunner', () => {
	it('runs a job for the right bearer secret and returns its result', async () => {
		const { purge, runner } = setup()

		await expect(runner.run('purge', `Bearer ${SECRET}`)).resolves.toEqual({
			purged: 3,
		})
		expect(purge).toHaveBeenCalledOnce()
	})

	it('does not exist until a secret is configured', async () => {
		const { purge, runner } = setup({})

		await expect(
			runner.run('purge', `Bearer ${SECRET}`),
		).rejects.toBeInstanceOf(NotFoundError)
		expect(purge).not.toHaveBeenCalled()
	})

	it('checks the secret before revealing whether a job exists', async () => {
		const { runner } = setup()

		await expect(runner.run('nope', 'Bearer wrong')).rejects.toBeInstanceOf(
			UnauthorizedError,
		)
		await expect(runner.run('nope', null)).rejects.toBeInstanceOf(
			UnauthorizedError,
		)
		await expect(runner.run('nope', `Bearer ${SECRET}`)).rejects.toBeInstanceOf(
			NotFoundError,
		)
	})

	it('never resolves an inherited property as a job', async () => {
		const { runner } = setup()

		await expect(
			runner.run('toString', `Bearer ${SECRET}`),
		).rejects.toBeInstanceOf(NotFoundError)
	})
})
