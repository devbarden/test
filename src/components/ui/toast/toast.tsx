import { XIcon } from 'lucide-react'
import styles from './toast.module.css'
import type { ToastOptions } from './toast-provider'

type ToastProps = ToastOptions & {
	onDismiss: () => void
	onPauseChange: (isPaused: boolean) => void
}

export function Toast({
	action,
	message,
	onDismiss,
	onPauseChange,
}: ToastProps) {
	const handleAction = () => {
		action?.onClick()
		onDismiss()
	}

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: hover and focus only pause the dismiss timer; focus bubbles up from the buttons inside
		<div
			className={styles.toast}
			onBlur={() => onPauseChange(false)}
			onFocus={() => onPauseChange(true)}
			onMouseEnter={() => onPauseChange(true)}
			onMouseLeave={() => onPauseChange(false)}
		>
			<span className={styles.message}>{message}</span>
			{action && (
				<button className={styles.action} onClick={handleAction} type="button">
					{action.label}
				</button>
			)}
			<button
				aria-label="Dismiss"
				className={styles.dismiss}
				onClick={onDismiss}
				type="button"
			>
				<XIcon aria-hidden="true" />
			</button>
		</div>
	)
}
