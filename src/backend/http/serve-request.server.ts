import type { AppConfig } from '../config.server'
import { errorResponse } from '../errors/error-response.server'
import { logAndNormalizeError } from '../errors/log-error.server'
import type { Logger } from '../observability/logger.server'
import { budgets } from '../rate-limit/budgets'
import type { RateLimiter } from '../rate-limit/rate-limiter.server'
import { withBodyLimit } from './request-body.server'
import {
	requestContextFrom,
	runWithRequestContext,
} from './request-context.server'
import { withSecurityHeaders } from './security-headers.server'

type Deps = {
	config: AppConfig
	rateLimiter: RateLimiter
	rootLogger: Logger
}

async function admit(
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
	handle: (request: Request) => Response | Promise<Response>,
): Promise<Response> {
	const context = requestContextFrom(request.headers)
	const { clientIp, requestId } = context
	const logger = deps.rootLogger.child(context)

	return runWithRequestContext(context, async () => {
		const response = await admit(request, clientIp, deps)
			.then(handle)
			.catch((error: unknown) =>
				errorResponse(logAndNormalizeError(error, logger)),
			)

		return withSecurityHeaders(response, {
			isProduction: deps.config.isProduction,
			requestId,
		})
	})
}
