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

function TextAnchor({ className, tone = 'accent', ...props }: TextAnchorProps) {
	return (
		<a {...props} className={clsx(styles.root, TONE_CLASS[tone], className)} />
	)
}

export const TextLink = createLink(TextAnchor)
