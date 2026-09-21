import { randomUUID } from 'node:crypto'
import handler, { createServerEntry } from '@tanstack/react-start/server-entry'
import { getAppContainer } from '@/backend/di/container.server'
import { errorResponse, PayloadTooLargeError } from '@/backend/errors.server'
import { registerGracefulShutdown } from '@/backend/lifecycle/shutdown.server'
import { logAndNormalizeError } from '@/backend/middleware/error-handling.server'
import { getClientIp } from '@/backend/web/client-ip'
import { runWithRequestContext } from '@/backend/web/request-context.server'
import { withSecurityHeaders } from '@/backend/web/security-headers.server'

// ═══════════════════════════════════════════════════════════════════════════
//   Resolved at module load, i.e. when the server boots: an invalid
//   environment throws here, the process never listens, and the deploy's
//   healthcheck fails instead of the first user's request.
// ═══════════════════════════════════════════════════════════════════════════
const container = getAppContainer()
const { config, rateLimiter, rootLogger } = container.cradle

registerGracefulShutdown(container)

// ═══════════════════════════════════════════════════════════════════════════
//   Exempt from the per-IP budget: the healthcheck (Railway polls it from
//   one address), and the callers that authenticate themselves and have a
//   budget of their own (webhooks and the scheduler).
// ═══════════════════════════════════════════════════════════════════════════
const IP_LIMIT_EXEMPT_PREFIXES = ['/api/health', '/api/webhooks/', '/api/cron/']

async function handle(request: Request, clientIp: string): Promise<Response> {
	const { pathname } = new URL(request.url)

	if (
		Number(request.headers.get('content-length') ?? 0) >
		config.limits.requestBodyBytes
	) {
		throw new PayloadTooLargeError()
	}

	if (!IP_LIMIT_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
		await rateLimiter.consume('ip', clientIp)
	}

	return handler.fetch(request)
}

export default createServerEntry({
	fetch(request) {
		const requestId =
			request.headers.get('x-railway-request-id') ?? randomUUID()
		const clientIp = getClientIp(request.headers)

		return runWithRequestContext({ clientIp, requestId }, async () => {
			const response = await handle(request, clientIp).catch((error: unknown) =>
				errorResponse(
					logAndNormalizeError(
						error,
						rootLogger.child({ clientIp, requestId }),
					),
				),
			)

			return withSecurityHeaders(response, {
				isProduction: config.isProduction,
				requestId,
			})
		})
	},
})
