import { QueryClientProvider } from '@tanstack/react-query'
import { Outlet } from '@tanstack/react-router'
import { DialogRoots } from '@/components/dialogs/dialog-roots'
import { AppShell } from '@/components/layout/app-shell'
import { ToastProvider } from '@/components/ui/toast'
import { PERSISTED_APPLICATIONS } from '@/features/applications/api/application.cache'
import { applicationKeys } from '@/features/applications/api/application.queries'
import { refreshUsage } from '@/features/billing/api/billing.cache'
import { useSyncPlanChanges } from '@/features/billing/hooks/use-sync-plan-changes'
import { AccountMenu } from '@/features/billing/ui/account-menu'
import { PlanLimitDialog } from '@/features/billing/ui/plan-limit-dialog'
import { getUserQueryClient } from '@/lib/query/user-query-client'
import { WorkspaceStatus } from './workspace-status'

export function WorkspaceShell({ userId }: { userId: string }) {
	const queryClient = getUserQueryClient(userId, PERSISTED_APPLICATIONS)

	useSyncPlanChanges(() => {
		void refreshUsage(queryClient)
		void queryClient.invalidateQueries({ queryKey: applicationKeys.stats() })
	})

	return (
		<QueryClientProvider client={queryClient}>
			<ToastProvider>
				<AppShell account={<AccountMenu />} status={<WorkspaceStatus />}>
					<Outlet />
				</AppShell>
				<DialogRoots />
				<PlanLimitDialog.Root />
			</ToastProvider>
		</QueryClientProvider>
	)
}
