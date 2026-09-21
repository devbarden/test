import { useGoalProgress } from '@/features/applications/hooks/use-goal-progress'
import { GoalIndicator } from '@/features/applications/ui/goal-indicator'
import { DailyLetters } from '@/features/billing/ui/daily-letters'

export function WorkspaceStatus() {
	const { isReached } = useGoalProgress()

	return isReached ? <DailyLetters /> : <GoalIndicator />
}
