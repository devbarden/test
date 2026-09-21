import { createLink } from '@tanstack/react-router'
import type { ComponentProps, ReactNode } from 'react'
import {
	type IconButtonVariant,
	iconButtonClassName,
} from './icon-button-styles'

type IconAnchorProps = Omit<ComponentProps<'a'>, 'children'> & {
	icon: ReactNode
	label: string
	variant?: IconButtonVariant
}

function IconAnchor({
	className,
	icon,
	label,
	variant = 'outline',
	...props
}: IconAnchorProps) {
	return (
		<a
			{...props}
			className={iconButtonClassName(variant, className)}
			title={label}
		>
			{icon}
			<span className="visually-hidden">{label}</span>
		</a>
	)
}

export const IconButtonLink = createLink(IconAnchor)
