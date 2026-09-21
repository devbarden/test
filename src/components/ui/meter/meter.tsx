import clsx from 'clsx'
import styles from './meter.module.css'

type MeterProps = {
	label: string
	max: number
	value: number
	valueText: string
}

// ═══════════════════════════════════════════════════════════════════════════
//   How much of an allowance is used. Assistive tech reads a real <meter>;
//   the bar beside it is drawn for the eye, because a native meter cannot
//   be styled the same way in every browser. It turns to the danger tone
//   once the allowance is spent — the moment the number starts to matter.
//   The visible label is hidden from assistive tech: the meter already
//   carries it, and reading both announced every allowance twice.
// ═══════════════════════════════════════════════════════════════════════════
export function Meter({ label, max, value, valueText }: MeterProps) {
	const ratio = max > 0 ? Math.min(value / max, 1) : 0

	return (
		<div className={styles.root}>
			<div aria-hidden="true" className={styles.header}>
				<span className={styles.label}>{label}</span>
				<span className={styles.value}>{valueText}</span>
			</div>
			<meter
				aria-label={label}
				aria-valuetext={valueText}
				className="visually-hidden"
				max={max}
				min={0}
				value={Math.min(value, max)}
			/>
			<div aria-hidden="true" className={styles.track}>
				<span
					className={clsx(styles.fill, ratio >= 1 && styles.full)}
					style={{ inlineSize: `${ratio * 100}%` }}
				/>
			</div>
		</div>
	)
}
