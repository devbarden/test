import { useQuery } from '@tanstack/react-query'
import { applicationQueries } from '../api/application.queries'
import { APPLICATION_GOAL } from '../model/application.schema'

// ═══════════════════════════════════════════════════════════════════════════
//   `isKnown` is false only on a first visit with nothing cached yet: the
//   header and banner stay quiet for that moment instead of announcing
//   "0/5" and then correcting themselves.
// ═══════════════════════════════════════════════════════════════════════════
export function useGoalProgress() {
	const { data } = useQuery(applicationQueries.stats())
	const count = data?.total ?? 0
	const goal = data?.goal ?? APPLICATION_GOAL

	return {
		count,
		goal,
		isKnown: data !== undefined,
		isReached: count >= goal,
	}
}
