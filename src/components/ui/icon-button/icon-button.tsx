import { createLink } from '@tanstack/react-router'
import clsx from 'clsx'
import type { ComponentProps, ReactNode } from 'react'
import styles from './icon-button.module.css'

type IconAnchorProps = Omit<ComponentProps<'a'>, 'children'> & {
	icon: ReactNode
	label: string
}

// ═══════════════════════════════════════════════════════════════════════════
//   `label` is required: an icon-only control with no accessible name is
//   invisible to a screen reader, and a type error is the only check that
//   never gets skipped. It is rendered as hidden text rather than an
//   aria-label so that page translators and find-in-page see it too.
// ═══════════════════════════════════════════════════════════════════════════
function IconAnchor({ className, icon, label, ...props }: IconAnchorProps) {
	return (
		<a {...props} className={clsx(styles.iconButton, className)} title={label}>
			{icon}
			<span className="visually-hidden">{label}</span>
		</a>
	)
}

export const IconButtonLink = createLink(IconAnchor)
