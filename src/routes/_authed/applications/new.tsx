import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ApplicationEditor } from '@/features/editor'

export const Route = createFileRoute('/_authed/applications/new')({
	component: NewApplicationPage,
	head: () => ({ meta: [{ title: 'New application — Alt+Shift' }] }),
})

// ═══════════════════════════════════════════════════════════════════════════
//   Once the first letter is saved the URL moves to the application's own
//   address, replacing /new in history: a reload or a shared link then opens
//   this letter rather than an empty form, and Back returns to where the
//   user came from, not to a form they already submitted. The blocker is
//   skipped because this navigation is the generation finishing, not the
//   user leaving it.
// ═══════════════════════════════════════════════════════════════════════════
function NewApplicationPage() {
	const navigate = useNavigate()

	return (
		<ApplicationEditor
			onSaved={(applicationId) =>
				navigate({
					ignoreBlocker: true,
					params: { applicationId },
					replace: true,
					to: '/applications/$applicationId',
				})
			}
		/>
	)
}
