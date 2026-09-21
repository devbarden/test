import { type ReactNode, useId } from 'react'
import styles from './segmented-control.module.css'

export type SegmentedOption<Value extends string> = {
	disabled?: boolean
	icon?: ReactNode
	label: string
	value: Value
}

type SegmentedControlProps<Value extends string> = {
	description?: ReactNode
	hideLabel?: boolean
	label: string
	onChange: (value: Value) => void
	options: readonly SegmentedOption<Value>[]
	value: Value
}

// ═══════════════════════════════════════════════════════════════════════════
//   A radio group drawn as a segmented switch. Real radio inputs underneath
//   (visually hidden, not display:none) keep what a screen reader and the
//   keyboard expect from a single choice: one tab stop, arrows to move, the
//   legend read as the question. The description is tied to the group, so
//   a screen reader hears why an option is disabled, not only that it is.
// ═══════════════════════════════════════════════════════════════════════════
export function SegmentedControl<Value extends string>({
	description,
	hideLabel = false,
	label,
	onChange,
	options,
	value,
}: SegmentedControlProps<Value>) {
	const name = useId()
	const descriptionId = `${name}-description`

	return (
		<fieldset
			aria-describedby={description ? descriptionId : undefined}
			className={styles.root}
		>
			<legend className={hideLabel ? 'visually-hidden' : styles.legend}>
				{label}
			</legend>
			<div className={styles.track}>
				{options.map((option) => (
					<label className={styles.option} key={option.value}>
						<input
							checked={option.value === value}
							className="visually-hidden"
							disabled={option.disabled}
							name={name}
							onChange={() => onChange(option.value)}
							type="radio"
							value={option.value}
						/>
						{option.icon}
						{option.label}
					</label>
				))}
			</div>
			{description && (
				<div className={styles.description} id={descriptionId}>
					{description}
				</div>
			)}
		</fieldset>
	)
}
