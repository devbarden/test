import { createLink } from '@tanstack/react-router'
import type { ComponentProps, ReactNode } from 'react'
import { iconButtonClassName } from './icon-button-styles'

type IconAnchorProps = Omit<ComponentProps<'a'>, 'children'> & {
	icon: ReactNode
	label: string
}

function IconAnchor({ className, icon, label, ...props }: IconAnchorProps) {
	return (
		<a {...props} className={iconButtonClassName(className)} title={label}>
			{icon}
			<span className="visually-hidden">{label}</span>
		</a>
	)
}

export const IconButtonLink = createLink(IconAnchor)
