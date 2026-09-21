import { CheckIcon, CopyIcon, TriangleAlertIcon } from 'lucide-react'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { m } from '@/paraglide/messages'
import { Button } from '../button'

// ═══════════════════════════════════════════════════════════════════════════
//   Functions, not strings: a message read at module scope would capture
//   the locale of whichever request first imported this file, forever.
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

// ═══════════════════════════════════════════════════════════════════════════
//   No text means nothing to copy yet — the button stays in place, disabled,
//   so the footer does not shift when the letter arrives. `subject` names
//   what is copied for a screen reader, where a page of cards would
//   otherwise offer twenty identical "Copy" buttons.
// ═══════════════════════════════════════════════════════════════════════════
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
