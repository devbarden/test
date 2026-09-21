import { XIcon } from 'lucide-react'
import { type FocusEvent, useEffect, useState } from 'react'
import { m } from '@/paraglide/messages'
import styles from './toast.module.css'
import type { ToastOptions } from './toast-provider'

type ToastProps = ToastOptions & {
	onDismiss: () => void
	onPauseChange: (isPaused: boolean) => void
}

// ═══════════════════════════════════════════════════════════════════════════
//   Hover and focus pause the timer independently, so moving the pointer
//   away never dismisses a toast the keyboard is inside.
// ═══════════════════════════════════════════════════════════════════════════
export function Toast({
	action,
	message,
	onDismiss,
	onPauseChange,
}: ToastProps) {
	const [isHovered, setIsHovered] = useState(false)
	const [hasFocus, setHasFocus] = useState(false)

	useEffect(() => {
		onPauseChange(isHovered || hasFocus)
	}, [isHovered, hasFocus, onPauseChange])

	const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
		if (!event.currentTarget.contains(event.relatedTarget)) setHasFocus(false)
	}

	const handleAction = () => {
		action?.onClick()
		onDismiss()
	}

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: hover and focus only pause the dismiss timer; focus bubbles up from the buttons inside
		<div
			className={styles.root}
			onBlur={handleBlur}
			onFocus={() => setHasFocus(true)}
			onPointerEnter={() => setIsHovered(true)}
			onPointerLeave={() => setIsHovered(false)}
		>
			<span className={styles.message}>{message}</span>
			{action && (
				<button className={styles.action} onClick={handleAction} type="button">
					{action.label}
				</button>
			)}
			<button
				aria-label={m['toast.dismiss']()}
				className={styles.dismiss}
				onClick={onDismiss}
				type="button"
			>
				<XIcon />
			</button>
		</div>
	)
}
