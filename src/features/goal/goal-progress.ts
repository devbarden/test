import { APPLICATION_GOAL, useApplications } from '@/features/applications'

export function useGoalProgress() {
	const count = useApplications().length

	return {
		count,
		goal: APPLICATION_GOAL,
		isReached: count >= APPLICATION_GOAL,
	}
}
