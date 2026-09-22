import { createContext, use } from 'react'

type FieldContextValue = {
	descriptionId: string | undefined
	id: string
	invalid: boolean
}

export const FieldContext = createContext<FieldContextValue | null>(null)

// ═══════════════════════════════════════════════════════════════════════════
//   Spread AFTER the control's own props, so a caller cannot break the
//   label and description pairing.
// ═══════════════════════════════════════════════════════════════════════════
export function useFieldControlProps() {
	const field = use(FieldContext)

	if (!field) throw new Error('Field controls must be rendered inside <Field>')

	return {
		'aria-describedby': field.descriptionId,
		'aria-invalid': field.invalid || undefined,
		id: field.id,
	}
}
