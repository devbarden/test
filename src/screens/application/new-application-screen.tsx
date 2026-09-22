import { useNavigate } from '@tanstack/react-router'
import { ApplicationEditor } from './editor/application-editor/application-editor'

// ═══════════════════════════════════════════════════════════════════════════
//   Replaces /new in history and keeps scroll, skipping the transition and
//   leave-guard: for the user the page did not change.
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
					viewTransition: false,
				})
			}
		/>
	)
}
