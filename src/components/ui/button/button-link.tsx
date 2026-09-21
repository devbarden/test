import { createLink } from '@tanstack/react-router'
import type { ComponentProps } from 'react'
import { ButtonContent, type ButtonContentProps } from './button-content'
import { type ButtonStyleProps, buttonClassName } from './button-styles'

type ButtonAnchorProps = ButtonStyleProps &
	Omit<ButtonContentProps, 'loading'> &
	Omit<ComponentProps<'a'>, keyof ButtonContentProps>

function ButtonAnchor({
	children,
	className,
	fullWidth,
	iconEnd,
	iconStart,
	size,
	variant,
	...props
}: ButtonAnchorProps) {
	return (
		<a
			{...props}
			className={buttonClassName({ fullWidth, size, variant }, className)}
		>
			<ButtonContent iconEnd={iconEnd} iconStart={iconStart}>
				{children}
			</ButtonContent>
		</a>
	)
}

export const ButtonLink = createLink(ButtonAnchor)
