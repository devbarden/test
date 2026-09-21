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
//   One toast at a time: an Undo for an older action still on screen would
//   be a trap. Focus returns to where it was when the toast closes.
// ═══════════════════════════════════════════════════════════════════════════
export function ToastProvider({ children }: { children: ReactNode }) {
	const [toast, setToast] = useState<ActiveToast | null>(null)
	const [isPaused, setIsPaused] = useState(false)
	const nextId = useRef(0)
	const returnFocusTo = useRef<HTMLElement | null>(null)

	useEffect(() => {
		if (!toast || isPaused) return

		const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS)

		return () => clearTimeout(timer)
	}, [toast, isPaused])

	const show = (options: ToastOptions) => {
		const active = document.activeElement
		returnFocusTo.current = active instanceof HTMLElement ? active : null
		setIsPaused(false)
		nextId.current += 1
		setToast({ ...options, id: nextId.current })
	}

	const dismiss = () => {
		setToast(null)
		setIsPaused(false)

		const target = returnFocusTo.current
		const fallback = document.querySelector<HTMLElement>('main')

		if (target?.isConnected) target.focus()
		else fallback?.focus()
	}

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
