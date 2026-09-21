import clsx from 'clsx'
import styles from './progress-ring.module.css'

type ProgressRingProps = {
	label: string
	max: number
	value: number
	valueText: string
}

// ═══════════════════════════════════════════════════════════════════════════
//   At zero the fill is not drawn: a round cap of length zero still paints
//   a dot.
// ═══════════════════════════════════════════════════════════════════════════
export function ProgressRing({
	label,
	max,
	value,
	valueText,
}: ProgressRingProps) {
	const ratio = max > 0 ? Math.min(value / max, 1) : 0

	return (
		<span className={styles.root}>
			<meter
				aria-label={label}
				aria-valuetext={valueText}
				className="visually-hidden"
				max={max}
				min={0}
				value={Math.min(value, max)}
			/>
			<svg aria-hidden="true" className={styles.ring} viewBox="0 0 36 36">
				<circle
					className={styles.track}
					cx="18"
					cy="18"
					pathLength={100}
					r="15"
				/>
				{ratio > 0 && (
					<circle
						className={clsx(styles.fill, ratio >= 1 && styles.full)}
						cx="18"
						cy="18"
						pathLength={100}
						r="15"
						style={{ strokeDashoffset: 100 - ratio * 100 }}
					/>
				)}
			</svg>
		</span>
	)
}
