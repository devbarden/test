import { createLink } from '@tanstack/react-router'
import clsx from 'clsx'
import type { ComponentProps, ReactNode } from 'react'
import styles from './icon-button-link.module.css'

type IconAnchorProps = Omit<ComponentProps<'a'>, 'children'> & {
	icon: ReactNode
	label: string
}

function IconAnchor({ className, icon, label, ...props }: IconAnchorProps) {
	return (
		<a {...props} className={clsx(styles.root, className)} title={label}>
			{icon}
			<span className="visually-hidden">{label}</span>
		</a>
	)
}

export const IconButtonLink = createLink(IconAnchor)
