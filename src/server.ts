import handler, { createServerEntry } from '@tanstack/react-start/server-entry'
import { getAppContainer } from '@/backend/di/container.server'
import { errorResponse } from '@/backend/errors/error-response.server'
import { logAndNormalizeError } from '@/backend/errors/log-error.server'
import { getClientIp } from '@/backend/http/client-ip.server'
import { asPermanentIfSpelling } from '@/backend/http/permanent-redirect.server'
import { withBodyLimit } from '@/backend/http/request-body.server'
import { runWithRequestContext } from '@/backend/http/request-context.server'
import { requestIdFrom } from '@/backend/http/request-id.server'
import { robotsHeader } from '@/backend/http/robots-header.server'
import { withSecurityHeaders } from '@/backend/http/security-headers.server'
import { registerProcessLifecycle } from '@/backend/lifecycle/process-lifecycle.server'
import { budgets } from '@/backend/rate-limit/budgets'
import {
	generateLlmsFullText,
	generateLlmsText,
} from '@/features/marketing/llms.server'
import {
	generateRobotsTxt,
	generateSitemap,
} from '@/lib/seo/robots-and-sitemap'
import { paraglideMiddleware } from '@/paraglide/server.js'

// ═══════════════════════════════════════════════════════════════════════════
//   Resolved when this bundle loads — on the first request, since Nitro
//   loads the app lazily. The environment was already validated at boot
//   (lifecycle/server-lifecycle.nitro.ts), so this cannot be where a bad
//   deploy is first noticed.
// ═══════════════════════════════════════════════════════════════════════════
const container = getAppContainer()
const { config, rateLimiter, rootLogger } = container.cradle

registerProcessLifecycle(container)

// ═══════════════════════════════════════════════════════════════════════════
//   Exempt from the per-IP budget: webhooks, which authenticate by
//   signature and have a budget of their own — Clerk retries from a few
//   shared IPs, and a busy minute must not lock out its deliveries.
// ═══════════════════════════════════════════════════════════════════════════
function isIpBudgetExempt(pathname: string): boolean {
	return pathname.startsWith('/api/webhooks/')
}

// ═══════════════════════════════════════════════════════════════════════════
//   Answered before the router: generated text that never needs an SSR
//   render, a session or a locale. Built from the same code and messages
//   the pages are (see lib/seo/robots-and-sitemap.ts and
//   features/marketing/llms.server.ts), so they cannot quote a page that
//   has since changed.
// ═══════════════════════════════════════════════════════════════════════════
const MACHINE_READABLE: Record<
	string,
	{ body: () => string; contentType: string }
> = {
	'/llms-full.txt': {
		body: generateLlmsFullText,
		contentType: 'text/plain; charset=utf-8',
	},
	'/llms.txt': {
		body: generateLlmsText,
		contentType: 'text/plain; charset=utf-8',
	},
	'/robots.txt': {
		body: generateRobotsTxt,
		contentType: 'text/plain; charset=utf-8',
	},
	'/sitemap.xml': {
		body: generateSitemap,
		contentType: 'application/xml; charset=utf-8',
	},
}

// ═══════════════════════════════════════════════════════════════════════════
//   The path of every request, in order: cap the body, charge the IP
//   budget, answer machine-readable files directly, and hand the rest to
//   the router with the request's locale made ambient — from the `/ru`
//   prefix on the landing, from the cookie inside the app — for everything
//   rendered below it, server functions included.
// ═══════════════════════════════════════════════════════════════════════════
async function handle(incoming: Request, clientIp: string): Promise<Response> {
	const request = withBodyLimit(incoming, config.http.maxRequestBodyBytes)
	const { pathname } = new URL(request.url)

	if (!isIpBudgetExempt(pathname)) {
		await rateLimiter.consume(budgets.clientIp(clientIp))
	}

	const machineReadable = MACHINE_READABLE[pathname]

	if (machineReadable) {
		return new Response(machineReadable.body(), {
			headers: {
				'Cache-Control': 'public, max-age=3600, s-maxage=86400',
				'Content-Type': machineReadable.contentType,
			},
		})
	}

	const response = await paraglideMiddleware(request, () =>
		handler.fetch(request),
	)

	return asPermanentIfSpelling(request, response)
}

export default createServerEntry({
	fetch(request) {
		const requestId = requestIdFrom(request.headers)
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
				robots: robotsHeader(request, response),
			})
		})
	},
})
