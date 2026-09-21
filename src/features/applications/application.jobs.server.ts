import type { ScheduledJobs } from '@/backend/jobs/job-runner.server'
import type { ApplicationMaintenanceService } from './application-maintenance.service.server'

// ═══════════════════════════════════════════════════════════════════════════
//   The applications' scheduled jobs, by the name in the cron URL
//   (POST /api/cron/<name>). The Railway cron service calls it daily.
// ═══════════════════════════════════════════════════════════════════════════
export function createApplicationJobs({
	applicationMaintenanceService,
}: {
	applicationMaintenanceService: ApplicationMaintenanceService
}): ScheduledJobs {
	return {
		'purge-deleted-applications': async () => ({
			purged: await applicationMaintenanceService.purgeDeleted(),
		}),
	}
}
