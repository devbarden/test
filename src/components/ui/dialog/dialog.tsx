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

	// ═════════════════════════════════════════════════════════════════════════
	//   The panel fills the box, so a click on the <dialog> itself is the
	//   backdrop; Esc is its keyboard equivalent.
	// ═════════════════════════════════════════════════════════════════════════
	useEffect(() => {
		const dialog = ref.current

		if (!dialog) return

		const closeOnBackdrop = (event: MouseEvent) => {
			if (event.target === dialog) dialog.close()
		}

		dialog.addEventListener('click', closeOnBackdrop)

		return () => dialog.removeEventListener('click', closeOnBackdrop)
	}, [])

	return (
		<dialog
			aria-describedby={description ? descriptionId : undefined}
			aria-labelledby={titleId}
			className={styles.root}
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
