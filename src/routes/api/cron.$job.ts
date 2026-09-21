import { timingSafeEqual } from 'node:crypto'
import { createFileRoute } from '@tanstack/react-router'
import type { AppCradle } from '@/backend/di/container.server'
import {
	errorResponse,
	NotFoundError,
	UnauthorizedError,
} from '@/backend/errors.server'
import { systemApiScopeMiddleware } from '@/backend/middleware/api-scope.middleware'

// ═══════════════════════════════════════════════════════════════════════════
//   Scheduled jobs, triggered by a Railway cron service with
//   `Authorization: Bearer $CRON_SECRET`. Running them inside the app
//   (rather than as a separate worker) means they use the same config,
//   pool and logging, and a job is just another use case of a service.
//
//   Without a configured secret every job answers 404 — the endpoint does
//   not exist until someone deliberately enables it.
// ═══════════════════════════════════════════════════════════════════════════
const JOBS: Record<string, (cradle: AppCradle) => Promise<unknown>> = {
	'purge-deleted-applications': async ({ applicationMaintenanceService }) => ({
		purged: await applicationMaintenanceService.purgeDeleted(),
	}),
}

function isAuthorized(header: string | null, secret: string): boolean {
	const expected = Buffer.from(`Bearer ${secret}`)
	const received = Buffer.from(header ?? '')

	return (
		received.length === expected.length && timingSafeEqual(received, expected)
	)
}

export const Route = createFileRoute('/api/cron/$job')({
	server: {
		handlers: {
			POST: async ({ context, params, request }) => {
				const { cradle } = context.scope
				const secret = cradle.config.cron.secret
				const job = JOBS[params.job]

				if (!secret || !job) return errorResponse(new NotFoundError())

				if (!isAuthorized(request.headers.get('authorization'), secret)) {
					return errorResponse(new UnauthorizedError())
				}

				const result = await job(cradle)

				cradle.logger.info({ job: params.job, result }, 'Cron job finished')

				return Response.json(result)
			},
		},
		middleware: [systemApiScopeMiddleware('cron')],
	},
})
