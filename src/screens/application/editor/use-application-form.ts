import { formOptions } from '@tanstack/react-form'
import { useAppForm } from '@/components/form'
import {
	type ApplicationDto,
	type ApplicationInput,
	applicationInputSchema,
	EMPTY_APPLICATION_INPUT,
} from '@/domain/applications/application.schema'
import { effectiveTone } from '@/domain/applications/application-tone'
import { useEntitlements } from '@/features/billing/hooks/use-entitlements'

export const applicationFormOptions = formOptions({
	defaultValues: EMPTY_APPLICATION_INPUT,
})

export function useApplicationForm(
	saved: ApplicationDto | undefined,
	onSubmit: (input: ApplicationInput) => Promise<void>,
) {
	const { entitlements } = useEntitlements()

	return useAppForm({
		...applicationFormOptions,
		defaultValues: saved?.input ?? EMPTY_APPLICATION_INPUT,
		onSubmit: ({ value }) => {
			const input = applicationInputSchema.parse(value)

			return onSubmit({
				...input,
				tone: effectiveTone(input.tone, entitlements.letterTones),
			})
		},
		validators: {
			onChange: applicationInputSchema,
			onMount: applicationInputSchema,
		},
	})
}
