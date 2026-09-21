import { CheckIcon } from 'lucide-react'
import { StepProgress } from '@/components/ui/step-progress'
import styles from './goal-indicator.module.css'
import { useGoalProgress } from './goal-progress'

export function GoalIndicator() {
	const { count, goal, isReached } = useGoalProgress()
	const label = `${count}/${goal} applications generated`

	return (
		<div className={styles.indicator}>
			<span className={styles.label}>
				{`${count}/${goal}`}
				<span className={styles.suffix}> applications generated</span>
			</span>
			{isReached ? (
				<span aria-label={label} className={styles.check} role="img">
					<CheckIcon aria-hidden="true" strokeWidth={2.5} />
				</span>
			) : (
				<StepProgress label={label} max={goal} value={count} variant="dots" />
			)}
		</div>
	)
}
