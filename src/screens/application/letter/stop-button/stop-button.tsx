import { SquareIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

type StopButtonProps = {
	onStop: () => void
}

export function StopButton({ onStop }: StopButtonProps) {
	return (
		<Button iconEnd={<SquareIcon />} onClick={onStop} variant="ghost">
			Stop
		</Button>
	)
}
