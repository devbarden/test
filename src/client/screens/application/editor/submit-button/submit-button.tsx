import { RefreshCwIcon } from 'lucide-react'
import { Button } from '@/client/kit/button'

type SubmitButtonProps = {
	disabled: boolean
	hasLetter: boolean
	isGenerating: boolean
}

export function SubmitButton({ disabled, hasLetter, isGenerating }: SubmitButtonProps) {
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
