import type { QueryClient } from '@tanstack/react-query'
import { billingKeys } from './billing.queries'

// ═══════════════════════════════════════════════════════════════════════════
//   Anything that spends or returns an allowance — a generation, a delete,
//   a plan change — calls this, so the usage shown never lags the server.
// ═══════════════════════════════════════════════════════════════════════════
export function refreshUsage(queryClient: QueryClient): Promise<void> {
	return queryClient.invalidateQueries({ queryKey: billingKeys.all })
}
