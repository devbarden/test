import { ConfirmDialog } from '../confirm-dialog'

// ═══════════════════════════════════════════════════════════════════════════
//   Where every callable dialog renders. Mounted once inside the workspace,
//   under the query client and the toasts, so a dialog can use both.
// ═══════════════════════════════════════════════════════════════════════════
export function DialogRoots() {
	return <ConfirmDialog.Root />
}
