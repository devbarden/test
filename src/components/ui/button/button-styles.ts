import clsx from 'clsx'
import styles from './button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'sm' | 'lg'

export type ButtonStyleProps = {
	fullWidth?: boolean
	size?: ButtonSize
	variant?: ButtonVariant
}

export function buttonClassName(
	{ fullWidth = false, size = 'sm', variant = 'primary' }: ButtonStyleProps,
	className?: string,
) {
	return clsx(
		styles.button,
		styles[variant],
		variant !== 'ghost' && styles[size],
		fullWidth && styles.fullWidth,
		className,
	)
}
