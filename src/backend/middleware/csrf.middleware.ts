import { createCsrfMiddleware } from '@tanstack/react-start'

// ═══════════════════════════════════════════════════════════════════════════
//   Server functions are POSTs authenticated by a cookie — exactly the shape
//   CSRF exploits. Only same-origin callers may invoke them. /api routes
//   make the same check in their own middleware (api-scope.middleware).
// ═══════════════════════════════════════════════════════════════════════════
export const csrfMiddleware = createCsrfMiddleware({
	filter: (context) => context.handlerType === 'serverFn',
})
