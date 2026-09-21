import type { ComponentProps, MouseEvent } from 'react'
import { ButtonContent, type ButtonContentProps } from './button-content'
import { type ButtonStyleProps, buttonClassName } from './button-styles'

type ButtonProps = ButtonStyleProps &
	ButtonContentProps &
	Omit<ComponentProps<'button'>, keyof ButtonContentProps>

// ═══════════════════════════════════════════════════════════════════════════
//   A loading button is NOT disabled. The mockup keeps it in its accent
//   colour, and a disabled button drops out of the tab order, taking the
//   user's focus with it mid-action. It is marked busy and swallows clicks
//   instead.
// ═══════════════════════════════════════════════════════════════════════════
export function Button({
	children,
	className,
	fullWidth,
	iconEnd,
	iconStart,
	loading = false,
	onClick,
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
			className={buttonClassName({ fullWidth, size, variant }, className)}
			onClick={handleClick}
			type={type}
		>
			<ButtonContent iconEnd={iconEnd} iconStart={iconStart} loading={loading}>
				{children}
			</ButtonContent>
		</button>
	)
}
