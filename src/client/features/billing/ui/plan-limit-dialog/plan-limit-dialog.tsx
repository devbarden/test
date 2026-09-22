import { createCallable } from 'react-call'
import { Button, ButtonLink } from '@/client/kit/button'
import { DIALOG_EXIT_MS, Dialog } from '@/client/kit/dialog'

export type PlanLimit = 'daily' | 'saved'

type PlanLimitDialogProps = {
	hoursUntilReset: number
	limit: number
	reason: PlanLimit
	upgradeLimit?: number
}

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
				title={reason === 'daily' ? 'Your daily letters are used up' : 'No room for another application'}
			/>
		)
	},
	DIALOG_EXIT_MS,
)

function description({ hoursUntilReset, limit, reason, upgradeLimit }: PlanLimitDialogProps): string {
	const plan = upgradeLimit === undefined ? 'Your plan' : 'The Free plan'

	if (reason === 'daily') {
		const upgrade = upgradeLimit === undefined ? '' : ` — or move to Pro for ${upgradeLimit} a day`

		return `${plan} includes ${limit} letters a day. New ones arrive in ${hoursUntilReset} h${upgrade}.`
	}

	const upgrade = upgradeLimit === undefined ? ' to make room' : `, or move to Pro to keep up to ${upgradeLimit}`

	return `${plan} keeps up to ${limit} applications. Delete one you no longer need${upgrade}.`
}
