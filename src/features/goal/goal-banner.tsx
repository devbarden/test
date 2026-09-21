import { PlusIcon } from 'lucide-react'
import { useId } from 'react'
import { ButtonLink } from '@/components/ui/button'
import { Panel } from '@/components/ui/panel'
import { StepProgress } from '@/components/ui/step-progress'
import styles from './goal-banner.module.css'
import { useGoalProgress } from './goal-progress'

// ═══════════════════════════════════════════════════════════════════════════
//   Owns its own visibility: the rule "shown until the goal is met" is the
//   banner's, so no screen that renders it can forget to apply it.
// ═══════════════════════════════════════════════════════════════════════════
export function GoalBanner() {
	const { count, goal, isKnown, isReached } = useGoalProgress()
	const titleId = useId()

	if (!isKnown || isReached) return null

	return (
		<Panel
			aria-labelledby={titleId}
			className={styles.banner}
			role="region"
			tone="success"
		>
			<h2 className={styles.title} id={titleId}>
				Hit your goal
			</h2>
			<p className={styles.description}>
				Generate and send out couple more job applications today to get hired
				faster
			</p>
			<ButtonLink iconStart={<PlusIcon />} size="lg" to="/applications/new">
				Create New
			</ButtonLink>
			<div className={styles.progress}>
				<StepProgress
					label={`${count} of ${goal} applications generated`}
					max={goal}
					value={count}
					variant="bars"
				/>
				<span aria-hidden="true" className={styles.count}>
					{`${count} out of ${goal}`}
				</span>
			</div>
		</Panel>
	)
}
