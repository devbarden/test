import { withForm } from '@/components/form'
import type { SegmentedOption } from '@/components/ui/segmented-control'
import { INPUT_LIMITS } from '@/domain/applications/application.schema'
import type { LetterTone } from '@/domain/applications/application-tone'
import { useEntitlements } from '@/features/billing/hooks/use-entitlements'
import styles from './application-form.module.css'
import { SubmitButton } from './submit-button'
import { applicationFormOptions } from './use-application-form'

const TONE_OPTIONS: SegmentedOption<LetterTone>[] = [
	{ label: 'Professional', value: 'professional' },
	{ label: 'Warm', value: 'warm' },
	{ label: 'Confident', value: 'confident' },
]

type ApplicationFormProps = {
	hasLetter: boolean
	isGenerating: boolean
}

export const ApplicationForm = withForm({
	...applicationFormOptions,
	props: {} as ApplicationFormProps,
	render: function ApplicationFormRender({ form, hasLetter, isGenerating }) {
		const { entitlements } = useEntitlements()

		return (
			<form
				className={styles.root}
				noValidate
				onSubmit={(event) => {
					event.preventDefault()
					// ═════════════════════════════════════════════════════════
					//   TanStack Form does not refuse a second submit while the
					//   first is pending, and Enter in a field still submits.
					// ═════════════════════════════════════════════════════════
					if (!form.state.isSubmitting) void form.handleSubmit()
				}}
			>
				<div className={styles.row}>
					<form.AppField name="jobTitle">
						{(field) => (
							<field.TextField
								autoComplete="organization-title"
								label="Job title"
								maxLength={INPUT_LIMITS.jobTitle}
								placeholder="Product manager"
								required
							/>
						)}
					</form.AppField>
					<form.AppField name="company">
						{(field) => (
							<field.TextField
								autoComplete="organization"
								label="Company"
								maxLength={INPUT_LIMITS.company}
								placeholder="Apple"
								required
							/>
						)}
					</form.AppField>
				</div>
				<form.AppField name="skills">
					{(field) => (
						<field.TextField
							label="I am good at..."
							maxLength={INPUT_LIMITS.skills}
							placeholder="HTML, CSS and doing things in time"
							required
						/>
					)}
				</form.AppField>
				{entitlements.letterTones && (
					<form.AppField name="tone">
						{(field) => (
							<field.SegmentedField label="Tone" options={TONE_OPTIONS} />
						)}
					</form.AppField>
				)}
				<form.AppField name="details">
					{(field) => (
						<field.TextAreaField
							label="Additional details"
							maxLength={INPUT_LIMITS.details}
							placeholder="Describe why you are a great fit or paste your bio"
						/>
					)}
				</form.AppField>
				<form.Subscribe selector={(state) => state.isValid}>
					{(isValid) => (
						<SubmitButton
							disabled={!isValid}
							hasLetter={hasLetter}
							isGenerating={isGenerating}
						/>
					)}
				</form.Subscribe>
			</form>
		)
	},
})
