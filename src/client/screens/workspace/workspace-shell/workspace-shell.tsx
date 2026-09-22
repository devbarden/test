import { QueryClientProvider } from '@tanstack/react-query'
import { Outlet } from '@tanstack/react-router'
import { PERSISTED_APPLICATIONS } from '@/client/features/applications/api/application.cache'
import { applicationKeys } from '@/client/features/applications/api/application.queries'
import { refreshUsage } from '@/client/features/billing/api/billing.cache'
import { useSyncPlanChanges } from '@/client/features/billing/hooks/use-sync-plan-changes'
import { AccountMenu } from '@/client/features/billing/ui/account-menu'
import { ToastProvider } from '@/client/kit/toast'
import { getUserQueryClient } from '@/client/lib/query/user-query-client'
import { AppShell } from '../app-shell'
import { DialogRoots } from '../dialog-roots'
import { WorkspaceStatus } from '../workspace-status'

type WorkspaceShellProps = {
	userId: string
}

export function WorkspaceShell({ userId }: WorkspaceShellProps) {
	const queryClient = getUserQueryClient(userId, PERSISTED_APPLICATIONS)

	useSyncPlanChanges(() => {
		refreshUsage(queryClient)
		queryClient.invalidateQueries({ queryKey: applicationKeys.stats() })
	})

	return (
		<QueryClientProvider client={queryClient}>
			<ToastProvider>
				<AppShell account={<AccountMenu />} status={<WorkspaceStatus />}>
					<Outlet />
				</AppShell>
				<DialogRoots />
			</ToastProvider>
		</QueryClientProvider>
	)
}
