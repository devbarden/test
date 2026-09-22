import type { QueryClient } from '@tanstack/react-query'
import { billingKeys } from './billing.queries'

export function refreshUsage(queryClient: QueryClient): Promise<void> {
	return queryClient.invalidateQueries({ queryKey: billingKeys.all })
}
