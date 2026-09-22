import type { ComponentProps } from 'react'
import { CharacterCount } from '@/client/kit/character-count'
import { Field, TextArea } from '@/client/kit/field'
import { useTextFieldBinding } from '../use-text-field-binding'

type TextAreaFieldProps = Omit<ComponentProps<'textarea'>, 'maxLength' | 'name' | 'onBlur' | 'onChange' | 'value'> & {
	label: string
	maxLength: number
}

export function TextAreaField({ label, maxLength, ...props }: TextAreaFieldProps) {
	const { control, invalid } = useTextFieldBinding()

	return (
		<Field
			description={<CharacterCount length={control.value.length} max={maxLength} />}
			invalid={invalid}
			label={label}
		>
			<TextArea {...props} {...control} />
		</Field>
	)
}
