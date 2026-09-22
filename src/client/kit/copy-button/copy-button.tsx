import { CheckIcon, CopyIcon, TriangleAlertIcon } from 'lucide-react'
import { useCopyToClipboard } from '@/client/lib/hooks/use-copy-to-clipboard'
import { Button } from '../button'

const LABELS = {
	copied: 'Copied',
	failed: 'Copy failed',
	idle: 'Copy to clipboard',
} as const

const ANNOUNCEMENTS = {
	copied: 'Letter copied to clipboard',
	failed: 'Could not copy the letter. Select the text and copy it manually.',
	idle: '',
} as const

const ICONS = {
	copied: <CheckIcon />,
	failed: <TriangleAlertIcon />,
	idle: <CopyIcon />,
} as const

type CopyButtonProps = {
	subject?: string
	text?: string
}

export function CopyButton({ subject, text }: CopyButtonProps) {
	const { copy, status } = useCopyToClipboard()

	return (
		<>
			<Button disabled={!text} iconEnd={ICONS[status]} onClick={() => text && copy(text)} variant="ghost">
				{LABELS[status]}
				{subject && <span className="visually-hidden">{`: ${subject}`}</span>}
			</Button>
			<span aria-live="polite" className="visually-hidden">
				{ANNOUNCEMENTS[status]}
			</span>
		</>
	)
}
