import type { ChangeEvent } from 'react'
import { useFieldContext } from './form-context'

// ═══════════════════════════════════════════════════════════════════════════
//   A field turns red only once the user has typed in it: the form is
//   validated on mount to keep submit disabled, not to scold an empty page.
// ═══════════════════════════════════════════════════════════════════════════
export function useTextFieldBinding() {
	const field = useFieldContext<string>()
	const { errors, isTouched } = field.state.meta

	return {
		control: {
			name: field.name,
			onBlur: field.handleBlur,
			onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => field.handleChange(event.target.value),
			value: field.state.value,
		},
		invalid: isTouched && errors.length > 0,
	}
}
