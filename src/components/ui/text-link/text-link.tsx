import { createLink } from '@tanstack/react-router'
import clsx from 'clsx'
import type { ComponentProps } from 'react'
import styles from './text-link.module.css'

type TextAnchorProps = ComponentProps<'a'>

function TextAnchor({ className, ...props }: TextAnchorProps) {
	return <a {...props} className={clsx(styles.root, className)} />
}

export const TextLink = createLink(TextAnchor)
