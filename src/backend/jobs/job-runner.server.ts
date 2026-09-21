import { timingSafeEqual } from 'node:crypto'
import type { AppConfig } from '../config.server'
import { NotFoundError, UnauthorizedError } from '../errors/app-error.server'
import type { Logger } from '../observability/logger.server'

export type JobResult = Record<string, unknown>

// ═══════════════════════════════════════════════════════════════════════════
//   Every scheduled job, by the name the cron service calls it with. Each
//   feature contributes its own (see application.jobs.server.ts) and the
//   composition root merges them, so the runner below knows how to run a
//   job but never what any job does.
// ═══════════════════════════════════════════════════════════════════════════
export type ScheduledJobs = Readonly<Record<string, () => Promise<JobResult>>>

// ═══════════════════════════════════════════════════════════════════════════
//   Scheduled jobs, triggered by the Railway cron service with
//   `Authorization: Bearer $CRON_SECRET`. Running them inside the app
//   (rather than as a separate worker) means they use the same config,
//   pool and logging, and a job is just another use case of a service.
//
//   Without a configured secret every job answers 404 — the endpoint does
//   not exist until someone deliberately enables it. The secret is checked
//   before the job name, so an unauthenticated caller cannot learn which
//   jobs exist, and compared in constant time so timing reveals nothing.
// ═══════════════════════════════════════════════════════════════════════════
export function createJobRunner({
	config,
	logger,
	scheduledJobs,
}: {
	config: AppConfig
	logger: Logger
	scheduledJobs: ScheduledJobs
}) {
	return {
		async run(name: string, authorization: string | null): Promise<JobResult> {
			const secret = config.cron.secret

			if (!secret) throw new NotFoundError('Jobs are not enabled')

			if (!isBearer(authorization, secret)) throw new UnauthorizedError()

			const job = Object.hasOwn(scheduledJobs, name)
				? scheduledJobs[name]
				: undefined

			if (!job) throw new NotFoundError(`Unknown job ${name}`)

			const startedAt = performance.now()
			const result = await job()

			logger.info(
				{
					durationMs: Math.round(performance.now() - startedAt),
					job: name,
					result,
				},
				'Job finished',
			)

			return result
		},
	}
}

export type JobRunner = ReturnType<typeof createJobRunner>

function isBearer(authorization: string | null, secret: string): boolean {
	const expected = Buffer.from(`Bearer ${secret}`)
	const received = Buffer.from(authorization ?? '')

	return (
		received.length === expected.length && timingSafeEqual(received, expected)
	)
}
