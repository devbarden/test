import { RefreshCwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { m } from '@/paraglide/messages'

type SubmitButtonProps = {
	disabled: boolean
	hasLetter: boolean
	isGenerating: boolean
}

// ═══════════════════════════════════════════════════════════════════════════
//   Once a letter exists the button turns secondary: the letter is now the
//   primary thing on the screen, and generating again is a fallback. While
//   generating it stays in the accent colour with a spinner, as in the
//   mockup, and is busy rather than disabled so focus does not jump away.
// ═══════════════════════════════════════════════════════════════════════════
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
