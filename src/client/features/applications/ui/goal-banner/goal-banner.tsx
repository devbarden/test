import { PlusIcon } from 'lucide-react'
import { useId } from 'react'
import { ButtonLink } from '@/client/kit/button'
import { Heading } from '@/client/kit/heading'
import { Panel } from '@/client/kit/panel'
import { StepProgress } from '@/client/kit/step-progress'
import { useGoalProgress } from '../../hooks/use-goal-progress'
import styles from './goal-banner.module.css'

export function GoalBanner() {
	const { count, goal, isKnown, isReached } = useGoalProgress()
	const titleId = useId()

	if (!isKnown || isReached) return null

	return (
		<Panel aria-labelledby={titleId} className={styles.root} role="region" tone="success">
			<Heading className={styles.title} id={titleId} size="md">
				Hit your goal
			</Heading>
			<p className={styles.description}>
				Generate and send out a couple more job applications today to get hired faster
			</p>
			<ButtonLink iconStart={<PlusIcon />} size="lg" to="/app/applications/create">
				Create New
			</ButtonLink>
			<div className={styles.progress}>
				<StepProgress label={`${count} of ${goal} applications generated`} max={goal} value={count} variant="bars" />
				<span aria-hidden="true" className={styles.count}>
					{`${count} out of ${goal}`}
				</span>
			</div>
		</Panel>
	)
}
