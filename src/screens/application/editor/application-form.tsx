import type { ChangeEvent, FormEvent } from 'react'
import { CharacterCount, Field, Input, TextArea } from '@/components/ui/field'
import {
	type ApplicationInput,
	applicationInputSchema,
	INPUT_LIMITS,
} from '@/features/applications/model/application.schema'
import { effectiveTone } from '@/features/applications/model/application-tone'
import { useEntitlements } from '@/features/billing/hooks/use-entitlements'
import { m } from '@/paraglide/messages'
import styles from './application-form.module.css'
import { SubmitButton } from './submit-button'
import { ToneControl } from './tone-control'

type ApplicationFormProps = {
	hasLetter: boolean
	isGenerating: boolean
	onChange: (value: ApplicationInput) => void
	onSubmit: (value: ApplicationInput) => void
	value: ApplicationInput
}

export function ApplicationForm({
	hasLetter,
	isGenerating,
	onChange,
	onSubmit,
	value,
}: ApplicationFormProps) {
	const { entitlements } = useEntitlements()
	const parsed = applicationInputSchema.safeParse(value)
	const detailsTooLong = value.details.length > INPUT_LIMITS.details

	const handleField =
		(field: Exclude<keyof ApplicationInput, 'tone'>) =>
		(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
			onChange({ ...value, [field]: event.target.value })

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		if (!parsed.success || isGenerating) return

		onSubmit({
			...parsed.data,
			tone: effectiveTone(parsed.data.tone, entitlements.letterTones),
		})
	}

	return (
		<form className={styles.root} noValidate onSubmit={handleSubmit}>
			<div className={styles.row}>
				<Field label={m['editor.form.jobTitle']()}>
					<Input
						autoComplete="organization-title"
						maxLength={INPUT_LIMITS.jobTitle}
						onChange={handleField('jobTitle')}
						placeholder={m['editor.form.jobTitlePlaceholder']()}
						required
						value={value.jobTitle}
					/>
				</Field>
				<Field label={m['editor.form.company']()}>
					<Input
						autoComplete="organization"
						maxLength={INPUT_LIMITS.company}
						onChange={handleField('company')}
						placeholder={m['editor.form.companyPlaceholder']()}
						required
						value={value.company}
					/>
				</Field>
			</div>
			<Field label={m['editor.form.skills']()}>
				<Input
					maxLength={INPUT_LIMITS.skills}
					onChange={handleField('skills')}
					placeholder={m['editor.form.skillsPlaceholder']()}
					required
					value={value.skills}
				/>
			</Field>
			{entitlements.letterTones && (
				<ToneControl
					onChange={(tone) => onChange({ ...value, tone })}
					value={value.tone}
				/>
			)}
			<Field
				description={
					<CharacterCount
						length={value.details.length}
						max={INPUT_LIMITS.details}
					/>
				}
				invalid={detailsTooLong}
				label={m['editor.form.details']()}
			>
				<TextArea
					onChange={handleField('details')}
					placeholder={m['editor.form.detailsPlaceholder']()}
					value={value.details}
				/>
			</Field>
			<SubmitButton
				disabled={!parsed.success}
				hasLetter={hasLetter}
				isGenerating={isGenerating}
			/>
		</form>
	)
}
