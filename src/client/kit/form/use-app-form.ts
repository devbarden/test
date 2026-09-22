import { createFormHook } from '@tanstack/react-form'
import { fieldContext, formContext } from './form-context'
import { SegmentedField } from './segmented-field'
import { TextAreaField } from './text-area-field'
import { TextField } from './text-field'

export const { useAppForm, withForm } = createFormHook({
	fieldComponents: { SegmentedField, TextAreaField, TextField },
	fieldContext,
	formComponents: {},
	formContext,
})
