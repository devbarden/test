type MeterValueProps = {
	label: string
	max: number
	value: number
	valueText: string
}

export function meterRatio(value: number, max: number): number {
	return max > 0 ? Math.min(value / max, 1) : 0
}

export function MeterValue({ label, max, value, valueText }: MeterValueProps) {
	return (
		<meter
			aria-label={label}
			aria-valuetext={valueText}
			className="visually-hidden"
			max={max}
			min={0}
			value={Math.min(value, max)}
		/>
	)
}
