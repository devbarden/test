import { useNavigate } from '@tanstack/react-router'
import { ApplicationEditor } from '../editor/application-editor'

// ═══════════════════════════════════════════════════════════════════════════
//   Replaces /new in history and keeps scroll, skipping the leave-guard: for
//   the user the page did not change. The remount is hidden by a crossfade.
// ═══════════════════════════════════════════════════════════════════════════
export function NewApplicationScreen() {
	const navigate = useNavigate()

	return (
		<ApplicationEditor
			onSaved={(application) =>
				navigate({
					ignoreBlocker: true,
					params: { applicationId: application.id },
					replace: true,
					resetScroll: false,
					state: { letterJustSaved: true },
					to: '/app/applications/$applicationId',
					viewTransition: { types: ['letter-saved'] },
				})
			}
		/>
	)
}
