import clsx from 'clsx'
import styles from './icon-button.module.css'

export type IconButtonVariant = 'outline' | 'ghost'

const VARIANT_CLASS = {
	ghost: styles.ghost,
	outline: styles.outline,
} satisfies Record<IconButtonVariant, string | undefined>

export function iconButtonClassName(
	variant: IconButtonVariant,
	className?: string,
) {
	return clsx(styles.root, VARIANT_CLASS[variant], className)
}
