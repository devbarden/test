import { createLink } from '@tanstack/react-router'
import clsx from 'clsx'
import type { ComponentProps } from 'react'
import styles from './text-link.module.css'

type TextAnchorProps = ComponentProps<'a'> & {
	tone?: 'accent' | 'muted'
}

// ═══════════════════════════════════════════════════════════════════════════
//   A link inside running text or a quiet list. The accent tone is
//   underlined — colour alone must not be what tells a link from a word —
//   and the muted tone is for navigation lists, where position already
//   says "this is a link".
// ═══════════════════════════════════════════════════════════════════════════
function TextAnchor({ className, tone = 'accent', ...props }: TextAnchorProps) {
	return <a {...props} className={clsx(styles.link, styles[tone], className)} />
}

export const TextLink = createLink(TextAnchor)
