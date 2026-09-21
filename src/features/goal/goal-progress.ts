import { useQuery } from '@tanstack/react-query'
import { APPLICATION_GOAL, applicationQueries } from '@/features/applications'

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
