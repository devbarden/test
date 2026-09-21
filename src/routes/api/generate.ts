import { auth } from '@clerk/tanstack-react-start/server'
import { createFileRoute } from '@tanstack/react-router'
import {
	errorResponse,
	handleGenerateRequest,
} from '@/server/generation/generate-handler.server'

export const Route = createFileRoute('/api/generate')({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const { userId } = await auth()

				if (!userId) return errorResponse({ code: 'unauthorized' })

				return handleGenerateRequest(request, userId)
			},
		},
	},
})
