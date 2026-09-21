import clsx from 'clsx'
import styles from './meter.module.css'

type MeterProps = {
	label: string
	max: number
	value: number
	valueText: string
}

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
