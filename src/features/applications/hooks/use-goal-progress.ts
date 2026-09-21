import { useQuery } from '@tanstack/react-query'
import { APPLICATION_GOAL } from '@/domain/applications/application.schema'
import { applicationQueries } from '../api/application.queries'

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
