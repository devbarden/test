import { useToast } from '@/components/ui/toast'
import type { Application } from '../model/application'
import { useApplicationStore } from '../storage/use-applications'

// ═══════════════════════════════════════════════════════════════════════════
//   Delete immediately and offer Undo, rather than asking "Are you sure?".
//   A confirmation dialog is friction on every delete to protect against
//   the rare wrong one; undo costs nothing on the right delete and fully
//   recovers the wrong one. Restoring keeps `createdAt`, so the letter
//   returns to the exact place it left.
// ═══════════════════════════════════════════════════════════════════════════
export function useDeleteApplication() {
	const store = useApplicationStore()
	const showToast = useToast()

	return (application: Application) => {
		store.remove(application.id)

		showToast({
			action: { label: 'Undo', onClick: () => store.save(application) },
			message: 'Application deleted',
		})
	}
}
