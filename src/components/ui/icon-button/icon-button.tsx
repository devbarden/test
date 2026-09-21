import type { ComponentProps, ReactNode } from 'react'
import {
	type IconButtonVariant,
	iconButtonClassName,
} from './icon-button-styles'

type IconButtonProps = Omit<ComponentProps<'button'>, 'children'> & {
	icon: ReactNode
	label: string
	variant?: IconButtonVariant
}

export function IconButton({
	className,
	icon,
	label,
	variant = 'outline',
	type = 'button',
	...props
}: IconButtonProps) {
	return (
		<button
			{...props}
			className={iconButtonClassName(variant, className)}
			title={label}
			type={type}
		>
			{icon}
			<span className="visually-hidden">{label}</span>
		</button>
	)
}
