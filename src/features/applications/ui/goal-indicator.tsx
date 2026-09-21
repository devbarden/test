import { HeaderStatus } from '@/components/layout/header-status'
import { StepProgress } from '@/components/ui/step-progress'
import { m } from '@/paraglide/messages'
import { useGoalProgress } from '../hooks/use-goal-progress'

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
