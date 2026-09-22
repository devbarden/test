import { HeaderStatus } from '@/client/kit/header-status'
import { StepProgress } from '@/client/kit/step-progress'
import { useGoalProgress } from '../../hooks/use-goal-progress'

export function GoalIndicator() {
	const { count, goal, isKnown } = useGoalProgress()

	if (!isKnown) return <HeaderStatus />

	const label = `${count}/${goal} applications generated`

	return (
		<HeaderStatus
			indicator={<StepProgress label={label} max={goal} value={count} variant="dots" />}
			suffix="applications generated"
			value={`${count}/${goal}`}
		/>
	)
}
