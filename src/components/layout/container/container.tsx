import clsx from 'clsx'
import type { ReactNode } from 'react'
import styles from './container.module.css'

type ContainerProps = {
	children: ReactNode
	className?: string
}

// ═══════════════════════════════════════════════════════════════════════════
//   The page's horizontal frame: centred, capped and with the gutter the
//   layout tokens define. The app and the landing share one width, so the
//   brand stays put when a visitor moves between them.
// ═══════════════════════════════════════════════════════════════════════════
export function Container({ children, className }: ContainerProps) {
	return <div className={clsx(styles.container, className)}>{children}</div>
}
