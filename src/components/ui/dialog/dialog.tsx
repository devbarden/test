import { type ReactNode, useEffect, useId, useRef } from 'react'
import { Heading } from '../heading'
import styles from './dialog.module.css'

type DialogProps = {
	actions: ReactNode
	closing?: boolean
	description?: ReactNode
	onDismiss: () => void
	title: string
}

// ═══════════════════════════════════════════════════════════════════════════
//   Rendered only while it is open: it shows itself as a modal on mount and
//   closes when `closing` turns true, so the owner (a react-call callable)
//   keeps it mounted just long enough for the exit transition.
//
//   Every way out that is not an action — Esc, a click on the backdrop —
//   ends in the native `close` event, which reports a dismissal unless the
//   dialog is already closing because an action ended it.
// ═══════════════════════════════════════════════════════════════════════════
export function Dialog({
	actions,
	closing = false,
	description,
	onDismiss,
	title,
}: DialogProps) {
	const ref = useRef<HTMLDialogElement>(null)
	const titleId = useId()
	const descriptionId = useId()

	useEffect(() => {
		const dialog = ref.current

		if (!dialog) return
		if (closing) dialog.close()
		else if (!dialog.open) dialog.showModal()
	}, [closing])

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: the click only catches the backdrop; Esc already closes a modal dialog natively
		<dialog
			aria-describedby={description ? descriptionId : undefined}
			aria-labelledby={titleId}
			className={styles.root}
			onClick={(event) => {
				if (event.target === event.currentTarget) event.currentTarget.close()
			}}
			onClose={() => {
				if (!closing) onDismiss()
			}}
			ref={ref}
		>
			<div className={styles.panel}>
				<Heading id={titleId} size="sm">
					{title}
				</Heading>
				{description && (
					<p className={styles.description} id={descriptionId}>
						{description}
					</p>
				)}
				<div className={styles.actions}>{actions}</div>
			</div>
		</dialog>
	)
}
