import type { ComponentProps } from 'react'
import { Field, Input } from '@/components/ui/field'
import { useTextFieldBinding } from './use-text-field-binding'

type TextFieldProps = Omit<ComponentProps<'input'>, 'name' | 'onBlur' | 'onChange' | 'value'> & {
	label: string
}

export function TextField({ label, ...props }: TextFieldProps) {
	const { control, invalid } = useTextFieldBinding()

	return (
		<Field invalid={invalid} label={label}>
			<Input {...props} {...control} />
		</Field>
	)
}
