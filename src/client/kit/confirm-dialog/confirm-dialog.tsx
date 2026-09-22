import { createCallable } from 'react-call'
import { Button } from '@/client/kit/button'
import { DIALOG_EXIT_MS, Dialog } from '@/client/kit/dialog'

type ConfirmDialogProps = {
	cancelLabel?: string
	confirmLabel: string
	message?: string
	title: string
	tone?: 'default' | 'danger'
}

// ═══════════════════════════════════════════════════════════════════════════
//   Cancel comes first and takes focus, so Enter never confirms a
//   destructive question.
// ═══════════════════════════════════════════════════════════════════════════
export const ConfirmDialog = createCallable<ConfirmDialogProps, boolean>(
	({ call, cancelLabel, confirmLabel, message, title, tone = 'default' }) => (
		<Dialog
			actions={
				<>
					<Button autoFocus onClick={() => call.end(false)} size="md" variant="secondary">
						{cancelLabel ?? 'Cancel'}
					</Button>
					<Button onClick={() => call.end(true)} size="md" variant={tone === 'danger' ? 'danger' : 'primary'}>
						{confirmLabel}
					</Button>
				</>
			}
			closing={call.ended}
			description={message}
			onDismiss={() => call.end(false)}
			title={title}
		/>
	),
	DIALOG_EXIT_MS,
)
