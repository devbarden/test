import { createLink } from '@tanstack/react-router'
import clsx from 'clsx'
import type { ComponentProps } from 'react'
import styles from './text-link.module.css'

type TextLinkTone = 'accent' | 'muted'

type TextAnchorProps = ComponentProps<'a'> & {
	tone?: TextLinkTone
}

const TONE_CLASS = {
	accent: styles.accent,
	muted: styles.muted,
} satisfies Record<TextLinkTone, string | undefined>

// ═══════════════════════════════════════════════════════════════════════════
//   A link inside running text or a quiet list. The accent tone is
//   underlined — colour alone must not be what tells a link from a word —
//   and the muted tone is for navigation lists, where position already
//   says "this is a link".
// ═══════════════════════════════════════════════════════════════════════════
function TextAnchor({ className, tone = 'accent', ...props }: TextAnchorProps) {
	return (
		<a {...props} className={clsx(styles.root, TONE_CLASS[tone], className)} />
	)
}

export const TextLink = createLink(TextAnchor)
