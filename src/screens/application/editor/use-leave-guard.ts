import { useBlocker } from '@tanstack/react-router'
import { ConfirmDialog } from '@/components/dialogs/confirm-dialog'

// ═══════════════════════════════════════════════════════════════════════════
//   While a letter streams, leaving would throw it away: in-app navigation
//   asks first, and closing the tab gets the browser's own warning.
// ═══════════════════════════════════════════════════════════════════════════
export function useLeaveGuard(isActive: boolean): void {
	useBlocker({
		disabled: !isActive,
		enableBeforeUnload: () => isActive,
		shouldBlockFn: async () =>
			!(await ConfirmDialog.call({
				cancelLabel: 'Stay',
				confirmLabel: 'Leave',
				message:
					'Your letter is still being written. If you leave now, it will be discarded.',
				title: 'Leave while the letter is written?',
				tone: 'danger',
			})),
	})
}
