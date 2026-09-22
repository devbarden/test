import { XIcon } from 'lucide-react'
import { useEffect, useEffectEvent, useRef } from 'react'
import styles from './toast.module.css'
import type { ToastOptions } from './toast-provider'

const TOAST_DURATION_MS = 6000

const HELD_RECHECK_MS = 250

type ToastProps = ToastOptions & {
	onDismiss: () => void
	onExpire: () => void
}

// ═══════════════════════════════════════════════════════════════════════════
//   Never expires under the pointer or focus: it waits while `:hover` or
//   `:focus-within` matches, then gets its full time again.
// ═══════════════════════════════════════════════════════════════════════════
export function Toast({ action, message, onDismiss, onExpire }: ToastProps) {
	const root = useRef<HTMLDivElement>(null)
	const expire = useEffectEvent(onExpire)

	useEffect(() => {
		let timer: ReturnType<typeof setTimeout>

		const isHeld = () => root.current?.matches(':hover, :focus-within') ?? false

		const waitForRelease = () => {
			timer = isHeld() ? setTimeout(waitForRelease, HELD_RECHECK_MS) : setTimeout(timeUp, TOAST_DURATION_MS)
		}

		const timeUp = () => {
			if (isHeld()) waitForRelease()
			else expire()
		}

		timer = setTimeout(timeUp, TOAST_DURATION_MS)

		return () => clearTimeout(timer)
	}, [])

	const handleAction = () => {
		action?.onClick()
		onDismiss()
	}

	return (
		<div className={styles.root} ref={root}>
			<span className={styles.message}>{message}</span>
			{action && (
				<button className={styles.action} onClick={handleAction} type="button">
					{action.label}
				</button>
			)}
			<button aria-label="Dismiss" className={styles.dismiss} onClick={onDismiss} type="button">
				<XIcon />
			</button>
		</div>
	)
}
