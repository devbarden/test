import { PlanLimitDialog } from '@/client/features/billing/ui/plan-limit-dialog'
import { ConfirmDialog } from '@/client/kit/confirm-dialog'

export function DialogRoots() {
	return (
		<>
			<ConfirmDialog.Root />
			<PlanLimitDialog.Root />
		</>
	)
}
