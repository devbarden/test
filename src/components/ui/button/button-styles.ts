import clsx from 'clsx'
import styles from './button.module.css'

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

export type ButtonShape = 'rounded' | 'pill'

// ═══════════════════════════════════════════════════════════════════════════
//   A ghost button is a bare label with an icon, so it takes no size and no
//   shape — the union makes `size` on a ghost a type error instead of a
//   prop that is silently ignored.
// ═══════════════════════════════════════════════════════════════════════════
export type ButtonStyleProps = { fullWidth?: boolean } & (
	| {
			shape?: ButtonShape
			size?: ButtonSize
			variant?: 'primary' | 'secondary'
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
		variant?: 'primary' | 'secondary' | 'ghost'
	},
	className?: string,
) {
	const isGhost = variant === 'ghost'

	return clsx(
		styles.button,
		styles[variant],
		!isGhost && styles[size],
		!isGhost && shape === 'pill' && styles.pill,
		fullWidth && styles.fullWidth,
		className,
	)
}
