import { useAuth } from '@clerk/tanstack-react-start'
import {
	FREE_ENTITLEMENTS,
	type Subscription,
	subscriptionFrom,
} from '@/domain/billing/billing.catalog'

type ClientEntitlements = Subscription & { isLoaded: boolean }

export function useEntitlements(): ClientEntitlements {
	const { has, isLoaded } = useAuth()

	if (!isLoaded || !has) {
		return { entitlements: FREE_ENTITLEMENTS, isLoaded: false, plan: 'free' }
	}

	return { ...subscriptionFrom(has), isLoaded: true }
}
