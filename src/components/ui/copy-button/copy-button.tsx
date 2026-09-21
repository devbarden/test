import { CheckIcon, CopyIcon, TriangleAlertIcon } from 'lucide-react'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { m } from '@/paraglide/messages'
import { Button } from '../button'

// ═══════════════════════════════════════════════════════════════════════════
//   Functions: a message read at module scope keeps the first request's
//   locale forever.
// ═══════════════════════════════════════════════════════════════════════════
const LABELS = {
	copied: () => m['copyButton.copied'](),
	failed: () => m['copyButton.failed'](),
	idle: () => m['copyButton.idle'](),
} as const

const ANNOUNCEMENTS = {
	copied: () => m['copyButton.announceCopied'](),
	failed: () => m['copyButton.announceFailed'](),
	idle: () => '',
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
			<Button
				disabled={!text}
				iconEnd={ICONS[status]}
				onClick={() => text && copy(text)}
				variant="ghost"
			>
				{LABELS[status]()}
				{subject && <span className="visually-hidden">{`: ${subject}`}</span>}
			</Button>
			<span aria-live="polite" className="visually-hidden">
				{ANNOUNCEMENTS[status]()}
			</span>
		</>
	)
}
