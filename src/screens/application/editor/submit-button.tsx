import { RefreshCwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { m } from '@/paraglide/messages'

type SubmitButtonProps = {
	disabled: boolean
	hasLetter: boolean
	isGenerating: boolean
}

export function SubmitButton({
	disabled,
	hasLetter,
	isGenerating,
}: SubmitButtonProps) {
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
			{hasLetter ? m['editor.form.tryAgain']() : m['editor.form.generate']()}
		</Button>
	)
}
