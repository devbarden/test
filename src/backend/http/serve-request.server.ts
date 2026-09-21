import type { AppConfig } from '../config.server'
import { errorResponse } from '../errors/error-response.server'
import { logAndNormalizeError } from '../errors/log-error.server'
import type { Logger } from '../observability/logger.server'
import { budgets } from '../rate-limit/budgets'
import type { RateLimiter } from '../rate-limit/rate-limiter.server'
import { getClientIp } from './client-ip.server'
import { withBodyLimit } from './request-body.server'
import { runWithRequestContext } from './request-context.server'
import { requestIdFrom } from './request-id.server'
import { robotsHeader } from './robots-header.server'
import { withSecurityHeaders } from './security-headers.server'

type Deps = {
	config: AppConfig
	rateLimiter: RateLimiter
	rootLogger: Logger
}

async function guard(
	incoming: Request,
	clientIp: string,
	{ config, rateLimiter }: Deps,
): Promise<Request> {
	const request = withBodyLimit(incoming, config.http.maxRequestBodyBytes)

	// ═════════════════════════════════════════════════════════════════════════
	//   Webhooks skip the IP budget: Clerk retries from a few shared IPs.
	// ═════════════════════════════════════════════════════════════════════════
	if (!new URL(request.url).pathname.startsWith('/api/webhooks/')) {
		await rateLimiter.consume(budgets.clientIp(clientIp))
	}

	return request
}

export function serveRequest(
	request: Request,
	deps: Deps,
	handle: (request: Request) => Promise<Response>,
): Promise<Response> {
	const requestId = requestIdFrom(request.headers)
	const clientIp = getClientIp(request.headers)
	const logger = deps.rootLogger.child({ clientIp, requestId })

	return runWithRequestContext({ clientIp, requestId }, async () => {
		const response = await guard(request, clientIp, deps)
			.then(handle)
			.catch((error: unknown) =>
				errorResponse(logAndNormalizeError(error, logger)),
			)

		return withSecurityHeaders(response, {
			isProduction: deps.config.isProduction,
			requestId,
			robots: robotsHeader(request, response),
		})
	})
}
