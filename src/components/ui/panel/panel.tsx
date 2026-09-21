import clsx from 'clsx'
import type { ComponentProps } from 'react'
import styles from './panel.module.css'

type PanelProps = ComponentProps<'div'> & {
	tone?: 'muted' | 'success'
}

// ═══════════════════════════════════════════════════════════════════════════
//   The one container shape in the mockups: a borderless rounded surface
//   that is only ever told apart by its tint — grey for content (letter
//   cards, the letter preview), green for encouragement (the goal banner).
// ═══════════════════════════════════════════════════════════════════════════
export function Panel({ className, tone = 'muted', ...props }: PanelProps) {
	return (
		<div {...props} className={clsx(styles.panel, styles[tone], className)} />
	)
}
