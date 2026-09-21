import type { ReactNode } from 'react'
import { Spinner } from '../spinner'
import styles from './button.module.css'

export type ButtonContentProps = {
	children: ReactNode
	iconEnd?: ReactNode
	iconStart?: ReactNode
	loading?: boolean
}

// ═══════════════════════════════════════════════════════════════════════════
//   While loading, the label stays in the accessibility tree and only the
//   spinner is shown: a screen reader keeps announcing "Generate Now, busy"
//   rather than an unlabeled button, and the button keeps its width.
// ═══════════════════════════════════════════════════════════════════════════
export function ButtonContent({
	children,
	iconEnd,
	iconStart,
	loading = false,
}: ButtonContentProps) {
	if (loading) {
		return (
			<>
				<Spinner />
				<span className="visually-hidden">{children}</span>
			</>
		)
	}

	return (
		<>
			{iconStart}
			<span className={styles.label}>{children}</span>
			{iconEnd}
		</>
	)
}
