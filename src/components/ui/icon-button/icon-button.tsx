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

// ═══════════════════════════════════════════════════════════════════════════
//   `label` is required: an icon-only control with no accessible name is
//   invisible to a screen reader, and a type error is the only check that
//   never gets skipped. It is rendered as hidden text rather than an
//   aria-label so that page translators and find-in-page see it too; the
//   title gives sighted pointer users the same words.
// ═══════════════════════════════════════════════════════════════════════════
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
