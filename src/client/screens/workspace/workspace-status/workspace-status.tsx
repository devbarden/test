import { useGoalProgress } from '@/client/features/applications/hooks/use-goal-progress'
import { GoalIndicator } from '@/client/features/applications/ui/goal-indicator'
import { DailyLetters } from '@/client/features/billing/ui/daily-letters'

export function WorkspaceStatus() {
	const { isReached } = useGoalProgress()

	return isReached ? <DailyLetters /> : <GoalIndicator />
}
