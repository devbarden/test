import { useGoalProgress } from '@/features/applications/hooks/use-goal-progress'
import { GoalIndicator } from '@/features/applications/ui/goal-indicator'
import { DailyLetters } from '@/features/billing/ui/daily-letters'

// ═══════════════════════════════════════════════════════════════════════════
//   The header counter answers whatever the user is working towards. Until
//   the goal of five letters it is that goal; once it is reached, a "5/5"
//   that never moves again says nothing, and the daily allowance — the
//   plan's real limit, on any plan — takes its place.
// ═══════════════════════════════════════════════════════════════════════════
export function WorkspaceStatus() {
	const { isReached } = useGoalProgress()

	return isReached ? <DailyLetters /> : <GoalIndicator />
}
