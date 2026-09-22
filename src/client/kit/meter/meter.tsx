import clsx from 'clsx'
import { MeterValue, meterRatio } from '@/client/kit/meter-value'
import styles from './meter.module.css'

type MeterProps = {
	label: string
	max: number
	value: number
}

export function Meter({ label, max, value }: MeterProps) {
	const valueText = `${value} of ${max}`
	const ratio = meterRatio(value, max)

	return (
		<div className={styles.root}>
			<div aria-hidden="true" className={styles.header}>
				<span className={styles.label}>{label}</span>
				<span className={styles.value}>{valueText}</span>
			</div>
			<MeterValue label={label} max={max} value={value} valueText={valueText} />
			<div aria-hidden="true" className={styles.track}>
				<span className={clsx(styles.fill, ratio >= 1 && styles.full)} style={{ inlineSize: `${ratio * 100}%` }} />
			</div>
		</div>
	)
}
