import { createCallable } from 'react-call'
import { Button, ButtonLink } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'

export type PlanLimit = 'daily' | 'saved'

type PlanLimitDialogProps = {
	hoursUntilReset: number
	limit: number
	reason: PlanLimit
	upgradeLimit?: number
}

const EXIT_TRANSITION_MS = 200

export const PlanLimitDialog = createCallable<PlanLimitDialogProps, void>(
	({ call, hoursUntilReset, limit, reason, upgradeLimit }) => {
		const close = () => call.end()

		return (
			<Dialog
				actions={
					upgradeLimit === undefined ? (
						<Button autoFocus onClick={close} size="md">
							Got it
						</Button>
					) : (
						<>
							<Button onClick={close} size="md" variant="secondary">
								Not now
							</Button>
							<ButtonLink autoFocus onClick={close} size="md" to="/app/billing">
								See plans
							</ButtonLink>
						</>
					)
				}
				closing={call.ended}
				description={description({
					hoursUntilReset,
					limit,
					reason,
					upgradeLimit,
				})}
				onDismiss={close}
				title={
					reason === 'daily'
						? 'Today’s letters are used up'
						: 'No room for another application'
				}
			/>
		)
	},
	EXIT_TRANSITION_MS,
)

function description({
	hoursUntilReset,
	limit,
	reason,
	upgradeLimit,
}: PlanLimitDialogProps): string {
	if (reason === 'daily') {
		return upgradeLimit === undefined
			? `Your plan includes ${limit} letters a day. New ones arrive in ${hoursUntilReset} h.`
			: `The Free plan includes ${limit} letters a day. New ones arrive in ${hoursUntilReset} h — or move to Pro for ${upgradeLimit} a day.`
	}

	return upgradeLimit === undefined
		? `Your plan keeps up to ${limit} applications. Delete one you no longer need to make room.`
		: `The Free plan keeps up to ${limit} applications. Delete one you no longer need, or move to Pro to keep up to ${upgradeLimit}.`
}
