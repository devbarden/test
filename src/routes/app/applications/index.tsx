import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { pageTitle } from '@/client/lib/document/brand'
import { DashboardScreen } from '@/client/screens/dashboard/dashboard-screen'
import { SEARCH_MAX_LENGTH } from '@/domain/applications/application-search'

const dashboardSearchSchema = z.object({
	q: z.string().max(SEARCH_MAX_LENGTH).optional().catch(undefined),
})

export const Route = createFileRoute('/app/applications/')({
	component: DashboardPage,
	head: () => ({
		meta: [{ title: pageTitle('Applications') }],
	}),
	validateSearch: dashboardSearchSchema,
})

function DashboardPage() {
	const { q = '' } = Route.useSearch()
	const navigate = Route.useNavigate()

	return (
		<DashboardScreen
			onSearchChange={(search) =>
				navigate({
					replace: true,
					resetScroll: false,
					search: search ? { q: search } : {},
				})
			}
			search={q}
		/>
	)
}
