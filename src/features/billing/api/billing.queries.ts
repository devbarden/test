import { queryOptions } from '@tanstack/react-query'
import { getBillingOverview } from './billing.api'

export const billingKeys = {
	all: ['billing'] as const,
	overview: () => [...billingKeys.all, 'overview'] as const,
}

export const billingQueries = {
	overview: () =>
		queryOptions({
			queryFn: () => getBillingOverview(),
			queryKey: billingKeys.overview(),
		}),
}
