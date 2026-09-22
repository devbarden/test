import { useId } from 'react'
import styles from './segmented-control.module.css'

export type SegmentedOption<Value extends string> = {
	label: string
	value: Value
}

type SegmentedControlProps<Value extends string> = {
	hideLabel?: boolean
	label: string
	onChange: (value: Value) => void
	options: readonly SegmentedOption<Value>[]
	value: Value
}

// ═══════════════════════════════════════════════════════════════════════════
//   Radios are visually hidden, not display:none, so the keyboard and
//   screen readers still treat it as one choice.
// ═══════════════════════════════════════════════════════════════════════════
export function SegmentedControl<Value extends string>({
	hideLabel = false,
	label,
	onChange,
	options,
	value,
}: SegmentedControlProps<Value>) {
	const name = useId()

	return (
		<fieldset className={styles.root}>
			<legend className={hideLabel ? 'visually-hidden' : styles.legend}>{label}</legend>
			<div className={styles.track}>
				{options.map((option) => (
					<label className={styles.option} key={option.value}>
						<input
							checked={option.value === value}
							className="visually-hidden"
							name={name}
							onChange={() => onChange(option.value)}
							type="radio"
							value={option.value}
						/>
						{option.label}
					</label>
				))}
			</div>
		</fieldset>
	)
}
