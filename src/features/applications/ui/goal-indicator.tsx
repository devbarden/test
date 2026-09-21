import { HeaderStatus } from '@/components/layout/header-status'
import { StepProgress } from '@/components/ui/step-progress'
import { m } from '@/paraglide/messages'
import { useGoalProgress } from '../hooks/use-goal-progress'

// ═══════════════════════════════════════════════════════════════════════════
//   Progress towards the goal, shown only until it is reached; after that
//   the workspace header shows the daily allowance instead.
// ═══════════════════════════════════════════════════════════════════════════
export function GoalIndicator() {
	const { count, goal, isKnown } = useGoalProgress()

	if (!isKnown) return <HeaderStatus />

	const label = m['goal.indicator']({ count, goal })

	return (
		<HeaderStatus
			indicator={
				<StepProgress label={label} max={goal} value={count} variant="dots" />
			}
			suffix={m['goal.indicatorSuffix']()}
			value={`${count}/${goal}`}
		/>
	)
}
