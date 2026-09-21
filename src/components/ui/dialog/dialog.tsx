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
//   Esc and a backdrop click end in the native `close` event, reported as
//   a dismissal unless an action is already closing the dialog.
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
