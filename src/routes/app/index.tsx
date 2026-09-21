import { createFileRoute, redirect } from '@tanstack/react-router'

// ═══════════════════════════════════════════════════════════════════════════
//   `/app` is the workspace's own address, not a page: it opens on the
//   letters, the one screen every visit starts from.
// ═══════════════════════════════════════════════════════════════════════════
export const Route = createFileRoute('/app/')({
	beforeLoad: () => {
		throw redirect({ replace: true, to: '/app/applications' })
	},
})
