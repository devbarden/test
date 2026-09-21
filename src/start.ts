import { clerkMiddleware } from '@clerk/tanstack-react-start/server'
import { createStart } from '@tanstack/react-start'
import { csrfMiddleware } from '@/backend/middleware/csrf.middleware'

// ═══════════════════════════════════════════════════════════════════════════
//   Order is the contract: a forged cross-origin call is refused before it
//   costs a session lookup, and Clerk runs before anything that reads the
//   auth state it attaches to the request.
// ═══════════════════════════════════════════════════════════════════════════
export const startInstance = createStart(() => ({
	requestMiddleware: [csrfMiddleware, clerkMiddleware()],
}))
