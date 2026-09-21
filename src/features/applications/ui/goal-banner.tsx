import { PlusIcon } from 'lucide-react'
import { useId } from 'react'
import { ButtonLink } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { Panel } from '@/components/ui/panel'
import { StepProgress } from '@/components/ui/step-progress'
import { m } from '@/paraglide/messages'
import { useGoalProgress } from '../hooks/use-goal-progress'
import styles from './goal-banner.module.css'

export function GoalBanner() {
	const { count, goal, isKnown, isReached } = useGoalProgress()
	const titleId = useId()

	if (!isKnown || isReached) return null

	return (
		<Panel
			aria-labelledby={titleId}
			className={styles.root}
			role="region"
			tone="success"
		>
			<Heading className={styles.title} id={titleId} size="md">
				{m['goal.title']()}
			</Heading>
			<p className={styles.description}>{m['goal.description']()}</p>
			<ButtonLink
				iconStart={<PlusIcon />}
				size="lg"
				to="/app/applications/create"
			>
				{m['goal.createNew']()}
			</ButtonLink>
			<div className={styles.progress}>
				<StepProgress
					label={m['goal.progress']({ count, goal })}
					max={goal}
					value={count}
					variant="bars"
				/>
				<span aria-hidden="true" className={styles.count}>
					{m['goal.progressShort']({ count, goal })}
				</span>
			</div>
		</Panel>
	)
}
