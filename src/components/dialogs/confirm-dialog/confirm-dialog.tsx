import { createCallable } from 'react-call'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { m } from '@/paraglide/messages'

export type ConfirmDialogProps = {
	cancelLabel?: string
	confirmLabel: string
	message?: string
	title: string
	tone?: 'default' | 'danger'
}

const EXIT_TRANSITION_MS = 200

// ═══════════════════════════════════════════════════════════════════════════
//   A question the code can await: `if (await ConfirmDialog.call({…}))`.
//   The same callable pattern as every dialog in the product (react-call):
//   no open/close state in the caller, and `<DialogRoots />` mounts the one
//   place it renders. Cancel comes first and takes the focus, so Enter on
//   a destructive question never destroys anything.
// ═══════════════════════════════════════════════════════════════════════════
export const ConfirmDialog = createCallable<ConfirmDialogProps, boolean>(
	({ call, cancelLabel, confirmLabel, message, title, tone = 'default' }) => (
		<Dialog
			actions={
				<>
					<Button
						autoFocus
						onClick={() => call.end(false)}
						size="md"
						variant="secondary"
					>
						{cancelLabel ?? m['common.cancel']()}
					</Button>
					<Button
						onClick={() => call.end(true)}
						size="md"
						variant={tone === 'danger' ? 'danger' : 'primary'}
					>
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
	EXIT_TRANSITION_MS,
)
