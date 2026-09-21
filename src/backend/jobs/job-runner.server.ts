import { timingSafeEqual } from 'node:crypto'
import type { ApplicationMaintenanceService } from '@/features/applications/application-maintenance.service.server'
import type { AppConfig } from '../config.server'
import { NotFoundError, UnauthorizedError } from '../errors.server'
import type { Logger } from '../observability/logger.server'

type JobRunnerDeps = {
	applicationMaintenanceService: ApplicationMaintenanceService
	config: AppConfig
	logger: Logger
}

// ═══════════════════════════════════════════════════════════════════════════
//   Scheduled jobs, triggered by the Railway cron service with
//   `Authorization: Bearer $CRON_SECRET`. Running them inside the app
//   (rather than as a separate worker) means they use the same config,
//   pool and logging, and a job is just another use case of a service.
//
//   Without a configured secret every job answers 404 — the endpoint does
//   not exist until someone deliberately enables it. The secret is compared
//   in constant time so response timing reveals nothing about it.
// ═══════════════════════════════════════════════════════════════════════════
export function createJobRunner({
	applicationMaintenanceService,
	config,
	logger,
}: JobRunnerDeps) {
	const jobs: Record<string, () => Promise<Record<string, unknown>>> = {
		'purge-deleted-applications': async () => ({
			purged: await applicationMaintenanceService.purgeDeleted(),
		}),
	}

	function isAuthorized(authorization: string | null, secret: string) {
		const expected = Buffer.from(`Bearer ${secret}`)
		const received = Buffer.from(authorization ?? '')

		return (
			received.length === expected.length && timingSafeEqual(received, expected)
		)
	}

	return {
		async run(
			name: string,
			authorization: string | null,
		): Promise<Record<string, unknown>> {
			const secret = config.cron.secret
			const job = Object.hasOwn(jobs, name) ? jobs[name] : undefined

			if (!secret || !job) throw new NotFoundError(`Unknown job ${name}`)

			if (!isAuthorized(authorization, secret)) throw new UnauthorizedError()

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
