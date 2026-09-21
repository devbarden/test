import {
	createContext,
	type ReactNode,
	use,
	useEffect,
	useRef,
	useState,
} from 'react'
import { Toast } from './toast'

const TOAST_DURATION_MS = 6000

export type ToastOptions = {
	action?: { label: string; onClick: () => void }
	message: string
}

type ActiveToast = ToastOptions & { id: number }

const ToastContext = createContext<((toast: ToastOptions) => void) | null>(null)

// ═══════════════════════════════════════════════════════════════════════════
//   One toast at a time: a new one replaces the current one instead of
//   stacking. The product only ever toasts to offer "Undo" for the action
//   just taken, and an undo for an older action, still on screen under a
//   newer one, would be a trap. The timer pauses while the toast is hovered
//   or focused, so reaching for "Undo" never races the dismissal.
// ═══════════════════════════════════════════════════════════════════════════
export function ToastProvider({ children }: { children: ReactNode }) {
	const [toast, setToast] = useState<ActiveToast | null>(null)
	const [isPaused, setIsPaused] = useState(false)
	const nextId = useRef(0)

	useEffect(() => {
		if (!toast || isPaused) return

		const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS)

		return () => clearTimeout(timer)
	}, [toast, isPaused])

	const show = (options: ToastOptions) => {
		setIsPaused(false)
		nextId.current += 1
		setToast({ ...options, id: nextId.current })
	}

	const dismiss = () => setToast(null)

	return (
		<ToastContext value={show}>
			{children}
			<div aria-live="polite" role="status">
				{toast && (
					<Toast
						action={toast.action}
						key={toast.id}
						message={toast.message}
						onDismiss={dismiss}
						onPauseChange={setIsPaused}
					/>
				)}
			</div>
		</ToastContext>
	)
}

export function useToast() {
	const show = use(ToastContext)

	if (!show) throw new Error('useToast must be used inside <ToastProvider>')

	return show
}
