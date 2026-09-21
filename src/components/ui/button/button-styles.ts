import clsx from 'clsx'
import styles from './button.module.css'

type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonShape = 'rounded' | 'pill'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

const SIZE_CLASS = {
	lg: styles.lg,
	md: styles.md,
	sm: styles.sm,
} satisfies Record<ButtonSize, string | undefined>

const VARIANT_CLASS = {
	danger: styles.danger,
	ghost: styles.ghost,
	primary: styles.primary,
	secondary: styles.secondary,
} satisfies Record<ButtonVariant, string | undefined>

export type ButtonStyleProps = { fullWidth?: boolean } & (
	| {
			shape?: ButtonShape
			size?: ButtonSize
			variant?: 'primary' | 'secondary' | 'danger'
	  }
	| { shape?: never; size?: never; variant: 'ghost' }
)

export function buttonClassName(
	{
		fullWidth = false,
		shape = 'rounded',
		size = 'sm',
		variant = 'primary',
	}: {
		fullWidth?: boolean
		shape?: ButtonShape
		size?: ButtonSize
		variant?: ButtonVariant
	},
	className?: string,
) {
	const isGhost = variant === 'ghost'

	return clsx(
		styles.root,
		VARIANT_CLASS[variant],
		!isGhost && SIZE_CLASS[size],
		!isGhost && shape === 'pill' && styles.pill,
		fullWidth && styles.fullWidth,
		className,
	)
}
