import { useAuth } from '@clerk/tanstack-react-start'
import {
	FREE_ENTITLEMENTS,
	type Subscription,
	subscriptionFrom,
} from '../model/billing.catalog'

type ClientEntitlements = Subscription & { isLoaded: boolean }

// ═══════════════════════════════════════════════════════════════════════════
//   The browser reads the plan from the same session claims the server
//   enforces, through the same catalogue — so the form never offers an
//   option the server would refuse, and needs no request to know it. The
//   server stays the authority: this only decides what to show.
// ═══════════════════════════════════════════════════════════════════════════
export function useEntitlements(): ClientEntitlements {
	const { has, isLoaded } = useAuth()

	if (!isLoaded || !has) {
		return { entitlements: FREE_ENTITLEMENTS, isLoaded: false, plan: 'free' }
	}

	return { ...subscriptionFrom(has), isLoaded: true }
}
