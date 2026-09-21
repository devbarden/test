import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { SEARCH_MAX_LENGTH } from '@/features/applications/model/application-search'
import { pageTitle } from '@/lib/site'
import { m } from '@/paraglide/messages'
import { DashboardScreen } from '@/screens/dashboard/dashboard-screen'

const dashboardSearchSchema = z.object({
	q: z.string().max(SEARCH_MAX_LENGTH).optional().catch(undefined),
})

export const Route = createFileRoute('/app/applications/')({
	component: DashboardPage,
	head: () => ({
		meta: [{ title: pageTitle(m['meta.applications.title']()) }],
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
