import { QueryClientProvider } from '@tanstack/react-query'
import { Outlet } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/app-shell'
import { ToastProvider } from '@/components/ui/toast'
import { PERSISTED_APPLICATIONS } from '@/features/applications/api/application.cache'
import { applicationKeys } from '@/features/applications/api/application.queries'
import { GoalIndicator } from '@/features/applications/ui/goal-indicator'
import { refreshUsage } from '@/features/billing/api/billing.cache'
import { useSyncPlanChanges } from '@/features/billing/hooks/use-sync-plan-changes'
import { AccountMenu } from '@/features/billing/ui/account-menu'
import { getUserQueryClient } from '@/lib/query/user-query-client'

// ═══════════════════════════════════════════════════════════════════════════
//   The client arrives with the user's letters already restored from browser
//   storage, so the first paint is the cached state, not a spinner (see
//   getUserQueryClient for why it is not created here). A plan change
//   refetches whatever its limits came from, on every page of the
//   workspace, so it is wired here rather than in a screen.
// ═══════════════════════════════════════════════════════════════════════════
export function WorkspaceShell({ userId }: { userId: string }) {
	const queryClient = getUserQueryClient(userId, PERSISTED_APPLICATIONS)

	useSyncPlanChanges(() => {
		void refreshUsage(queryClient)
		void queryClient.invalidateQueries({ queryKey: applicationKeys.stats() })
	})

	return (
		<QueryClientProvider client={queryClient}>
			<ToastProvider>
				<AppShell account={<AccountMenu />} status={<GoalIndicator />}>
					<Outlet />
				</AppShell>
			</ToastProvider>
		</QueryClientProvider>
	)
}
