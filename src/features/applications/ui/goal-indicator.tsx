import { CheckIcon } from 'lucide-react'
import { StepProgress } from '@/components/ui/step-progress'
import { m } from '@/paraglide/messages'
import { useGoalProgress } from '../hooks/use-goal-progress'
import styles from './goal-indicator.module.css'

// ═══════════════════════════════════════════════════════════════════════════
//   The visible count is decoration for the eye — the progress bar (or the
//   check) carries the whole sentence for assistive tech, so it is read
//   once. A phone shows the bare numbers.
// ═══════════════════════════════════════════════════════════════════════════
export function GoalIndicator() {
	const { count, goal, isKnown, isReached } = useGoalProgress()
	const label = m['goal.indicator']({ count, goal })

	if (!isKnown) return <div aria-hidden="true" className={styles.indicator} />

	return (
		<div className={styles.indicator}>
			<span aria-hidden="true" className={styles.label}>
				{`${count}/${goal}`}
				<span className={styles.suffix}>{m['goal.indicatorSuffix']()}</span>
			</span>
			{isReached ? (
				<span aria-label={label} className={styles.check} role="img">
					<CheckIcon strokeWidth={2.5} />
				</span>
			) : (
				<StepProgress label={label} max={goal} value={count} variant="dots" />
			)}
		</div>
	)
}
