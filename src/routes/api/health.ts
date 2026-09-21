import { createFileRoute } from '@tanstack/react-router'

// ═══════════════════════════════════════════════════════════════════════════
//   Liveness: the process is up and serving. Deliberately touches no
//   dependency — a database outage must not make an orchestrator restart
//   healthy processes in a loop. Readiness is /api/health/ready.
// ═══════════════════════════════════════════════════════════════════════════
export const Route = createFileRoute('/api/health')({
	server: {
		handlers: {
			GET: () =>
				Response.json(
					{ status: 'ok' },
					{ headers: { 'Cache-Control': 'no-store' } },
				),
		},
	},
})
