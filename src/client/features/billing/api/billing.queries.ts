import { queryOptions } from '@tanstack/react-query'
import { getBillingOverview } from './billing.api'

const AFTER_RESET_MS = 1000

export const billingKeys = {
	all: ['billing'] as const,
	overview: () => [...billingKeys.all, 'overview'] as const,
}

export const billingQueries = {
	overview: () =>
		queryOptions({
			queryFn: () => getBillingOverview(),
			queryKey: billingKeys.overview(),
			// ═════════════════════════════════════════════════════════════════
			//   Refetched when the 24-hour window resets, so a tab left open
			//   does not keep showing a spent allowance.
			// ═════════════════════════════════════════════════════════════════
			refetchInterval: (query) => {
				const seconds = query.state.data?.usage.generationsResetInSeconds

				return seconds ? seconds * 1000 + AFTER_RESET_MS : false
			},
		}),
}
