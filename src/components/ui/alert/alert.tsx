import clsx from 'clsx'
import { CircleAlertIcon, InfoIcon } from 'lucide-react'
import styles from './alert.module.css'

type AlertProps = {
	children: string
	className?: string
	tone: 'danger' | 'info'
}

// ═══════════════════════════════════════════════════════════════════════════
//   `alert` interrupts a screen reader, `status` waits its turn: a failed
//   generation is worth interrupting for, a stop the user asked for is not.
// ═══════════════════════════════════════════════════════════════════════════
export function Alert({ children, className, tone }: AlertProps) {
	const Icon = tone === 'danger' ? CircleAlertIcon : InfoIcon

	return (
		<div
			className={clsx(styles.alert, styles[tone], className)}
			role={tone === 'danger' ? 'alert' : 'status'}
		>
			<Icon aria-hidden="true" className={styles.icon} />
			<p>{children}</p>
		</div>
	)
}
