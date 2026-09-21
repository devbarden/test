import clsx from 'clsx'
import type { ReactNode } from 'react'
import styles from './header-status.module.css'

type HeaderStatusProps = {
	hideOnPhone?: boolean
	indicator?: ReactNode
	suffix?: string
	value?: string
}

// ═══════════════════════════════════════════════════════════════════════════
//   The counter in the app header: a short value ("3/5"), the words after
//   it and a graphic — on a phone, the graphic alone. The text is for the
//   eye only; the indicator carries the accessible name and value. With no
//   value it renders an empty slot of the same kind, so the header does not
//   shift while the numbers load. `hideOnPhone` drops the whole counter
//   there, for one that is not worth the header's scarce room.
// ═══════════════════════════════════════════════════════════════════════════
export function HeaderStatus({
	hideOnPhone = false,
	indicator,
	suffix,
	value,
}: HeaderStatusProps) {
	const className = clsx(styles.root, hideOnPhone && styles.hideOnPhone)

	if (value === undefined)
		return <div aria-hidden="true" className={className} />

	return (
		<div className={className}>
			<span aria-hidden="true" className={styles.label}>
				{value}
				{suffix && <span className={styles.suffix}>{suffix}</span>}
			</span>
			{indicator}
		</div>
	)
}
