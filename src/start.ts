import { clerkMiddleware } from '@clerk/tanstack-react-start/server'
import { createStart } from '@tanstack/react-start'
import { csrfMiddleware } from '@/server/middleware/csrf.middleware'

export const startInstance = createStart(() => ({
	requestMiddleware: [csrfMiddleware, clerkMiddleware()],
}))
