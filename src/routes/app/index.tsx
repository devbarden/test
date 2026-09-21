import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/app/')({
	beforeLoad: () => {
		throw redirect({ replace: true, to: '/app/applications' })
	},
})
