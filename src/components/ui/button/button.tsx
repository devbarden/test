import type { ComponentProps, MouseEvent } from 'react'
import { ButtonContent, type ButtonContentProps } from './button-content'
import { type ButtonStyleProps, buttonClassName } from './button-styles'

type ButtonProps = ButtonStyleProps & ButtonContentProps & Omit<ComponentProps<'button'>, keyof ButtonContentProps>

// ═══════════════════════════════════════════════════════════════════════════
//   Loading is not disabled: a disabled button leaves the tab order and
//   drops the user's focus mid-action.
// ═══════════════════════════════════════════════════════════════════════════
export function Button({
	children,
	className,
	fullWidth,
	iconEnd,
	iconStart,
	loading = false,
	onClick,
	shape,
	size,
	type = 'button',
	variant,
	...props
}: ButtonProps) {
	const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
		if (loading) {
			event.preventDefault()
			return
		}

		onClick?.(event)
	}

	return (
		<button
			{...props}
			aria-busy={loading || undefined}
			aria-disabled={loading || undefined}
			className={buttonClassName({ fullWidth, shape, size, variant }, className)}
			onClick={handleClick}
			type={type}
		>
			<ButtonContent iconEnd={iconEnd} iconStart={iconStart} loading={loading}>
				{children}
			</ButtonContent>
		</button>
	)
}
