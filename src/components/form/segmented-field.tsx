import {
	SegmentedControl,
	type SegmentedOption,
} from '@/components/ui/segmented-control'
import { useFieldContext } from './form-context'

type SegmentedFieldProps<Value extends string> = {
	label: string
	options: readonly SegmentedOption<Value>[]
}

export function SegmentedField<Value extends string>({
	label,
	options,
}: SegmentedFieldProps<Value>) {
	const field = useFieldContext<Value>()

	return (
		<SegmentedControl
			label={label}
			onChange={field.handleChange}
			options={options}
			value={field.state.value}
		/>
	)
}
