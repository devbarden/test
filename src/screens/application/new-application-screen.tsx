import { useNavigate } from '@tanstack/react-router'
import { ApplicationEditor } from './editor/application-editor'

// ═══════════════════════════════════════════════════════════════════════════
//   Once the first letter is saved the URL moves to the application's own
//   address, replacing /new in history: a reload or a shared link then opens
//   this letter rather than an empty form, and Back returns to where the
//   user came from, not to a form they already submitted.
//
//   The page did not change for the user, so this navigation keeps the
//   scroll position (on a phone they are reading the letter, below the
//   form), skips the page transition and the leave-guard, and asks the
//   next page to put focus on the letter.
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
					to: '/applications/$applicationId',
					viewTransition: false,
				})
			}
		/>
	)
}
