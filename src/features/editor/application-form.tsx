import { RefreshCwIcon } from 'lucide-react'
import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { CharacterCount, Field, Input, TextArea } from '@/components/ui/field'
import {
	type ApplicationInput,
	applicationInputSchema,
	INPUT_LIMITS,
} from '@/features/applications'
import styles from './application-form.module.css'

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
	const parsed = applicationInputSchema.safeParse(value)
	const detailsTooLong = value.details.length > INPUT_LIMITS.details

	const update = (field: keyof ApplicationInput) => (next: string) =>
		onChange({ ...value, [field]: next })

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		if (parsed.success && !isGenerating) onSubmit(parsed.data)
	}

	return (
		<form className={styles.form} noValidate onSubmit={handleSubmit}>
			<div className={styles.row}>
				<Field label="Job title">
					<Input
						autoComplete="organization-title"
						maxLength={INPUT_LIMITS.jobTitle}
						onChange={(event) => update('jobTitle')(event.target.value)}
						placeholder="Product manager"
						required
						value={value.jobTitle}
					/>
				</Field>
				<Field label="Company">
					<Input
						autoComplete="organization"
						maxLength={INPUT_LIMITS.company}
						onChange={(event) => update('company')(event.target.value)}
						placeholder="Apple"
						required
						value={value.company}
					/>
				</Field>
			</div>
			<Field label="I am good at...">
				<Input
					maxLength={INPUT_LIMITS.skills}
					onChange={(event) => update('skills')(event.target.value)}
					placeholder="HTML, CSS and doing things in time"
					required
					value={value.skills}
				/>
			</Field>
			<Field
				description={
					<CharacterCount
						length={value.details.length}
						max={INPUT_LIMITS.details}
					/>
				}
				invalid={detailsTooLong}
				label="Additional details"
			>
				<TextArea
					onChange={(event) => update('details')(event.target.value)}
					placeholder="Describe why you are a great fit or paste your bio"
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

// ═══════════════════════════════════════════════════════════════════════════
//   Once a letter exists the button turns secondary: the letter is now the
//   primary thing on the screen, and generating again is a fallback. While
//   generating it stays in the accent colour with a spinner, as in the
//   mockup, and is busy rather than disabled so focus does not jump away.
// ═══════════════════════════════════════════════════════════════════════════
function SubmitButton({
	disabled,
	hasLetter,
	isGenerating,
}: {
	disabled: boolean
	hasLetter: boolean
	isGenerating: boolean
}) {
	const isRetry = hasLetter && !isGenerating

	return (
		<Button
			disabled={disabled && !isGenerating}
			fullWidth
			iconStart={isRetry ? <RefreshCwIcon /> : undefined}
			loading={isGenerating}
			size="lg"
			type="submit"
			variant={isRetry ? 'secondary' : 'primary'}
		>
			{hasLetter ? 'Try Again' : 'Generate Now'}
		</Button>
	)
}
