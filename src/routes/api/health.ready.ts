import { createFileRoute } from '@tanstack/react-router'
import { getAppContainer } from '@/backend/di/container.server'

export const Route = createFileRoute('/api/health/ready')({
	server: {
		handlers: {
			GET: async () => {
				const report = await getAppContainer().cradle.healthService.check()

				return Response.json(report, {
					headers: { 'Cache-Control': 'no-store' },
					status: report.status === 'ok' ? 200 : 503,
				})
			},
		},
	},
})
