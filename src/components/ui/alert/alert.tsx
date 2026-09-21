import clsx from 'clsx'
import { CircleAlertIcon, InfoIcon } from 'lucide-react'
import styles from './alert.module.css'

type AlertTone = 'danger' | 'info'

type AlertProps = {
	children: string
	className?: string
	tone: AlertTone
}

const TONE_CLASS = {
	danger: styles.danger,
	info: styles.info,
} satisfies Record<AlertTone, string | undefined>

// ═══════════════════════════════════════════════════════════════════════════
//   `alert` interrupts a screen reader, `status` waits its turn: a failed
//   generation is worth interrupting for, a stop the user asked for is not.
// ═══════════════════════════════════════════════════════════════════════════
export function Alert({ children, className, tone }: AlertProps) {
	const Icon = tone === 'danger' ? CircleAlertIcon : InfoIcon

	return (
		<div
			className={clsx(styles.root, TONE_CLASS[tone], className)}
			role={tone === 'danger' ? 'alert' : 'status'}
		>
			<Icon aria-hidden="true" />
			<p>{children}</p>
		</div>
	)
}
