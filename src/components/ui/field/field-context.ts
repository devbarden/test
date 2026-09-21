import { createContext, use } from 'react'

type FieldContextValue = {
	descriptionId: string | undefined
	id: string
	invalid: boolean
}

export const FieldContext = createContext<FieldContextValue | null>(null)

// ═══════════════════════════════════════════════════════════════════════════
//   The wiring a control needs to be announced properly — its id for the
//   <label>, the description it is described by, its validity — comes from
//   the surrounding Field, so a form can never pair a label with the wrong
//   input or forget aria-describedby on one of them.
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
