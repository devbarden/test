import { createCallable } from 'react-call'
import { Button, ButtonLink } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { m } from '@/paraglide/messages'

export type PlanLimit = 'daily' | 'saved'

export type PlanLimitDialogProps = {
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
							{m['billing.limitDialog.gotIt']()}
						</Button>
					) : (
						<>
							<Button onClick={close} size="md" variant="secondary">
								{m['billing.limitDialog.notNow']()}
							</Button>
							<ButtonLink autoFocus onClick={close} size="md" to="/app/billing">
								{m['billing.limitDialog.seePlans']()}
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
						? m['billing.limitDialog.dailyTitle']()
						: m['billing.limitDialog.savedTitle']()
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
			? m['billing.limitDialog.dailyWait']({ hours: hoursUntilReset, limit })
			: m['billing.limitDialog.dailyUpgrade']({
					hours: hoursUntilReset,
					limit,
					upgradeLimit,
				})
	}

	return upgradeLimit === undefined
		? m['billing.limitDialog.savedWait']({ limit })
		: m['billing.limitDialog.savedUpgrade']({ limit, upgradeLimit })
}
