import clsx from 'clsx'
import type { ComponentProps } from 'react'
import styles from './heading.module.css'

type HeadingSize = 'sm' | 'md' | 'lg' | 'xl'

type HeadingProps = ComponentProps<'h2'> & {
	as?: 'h1' | 'h2' | 'h3'
	size: HeadingSize
	tone?: 'default' | 'muted'
}

const SIZE_CLASS = {
	lg: styles.lg,
	md: styles.md,
	sm: styles.sm,
	xl: styles.xl,
} satisfies Record<HeadingSize, string | undefined>

// ═══════════════════════════════════════════════════════════════════════════
//   Level and size are separate on purpose: the level is the document
//   outline a screen reader navigates by, the size is how loud the heading
//   looks. A status page's h1 is small, a landing section's h2 is large.
// ═══════════════════════════════════════════════════════════════════════════
export function Heading({
	as: Level = 'h2',
	className,
	size,
	tone = 'default',
	...props
}: HeadingProps) {
	return (
		<Level
			{...props}
			className={clsx(
				styles.root,
				SIZE_CLASS[size],
				tone === 'muted' && styles.muted,
				className,
			)}
		/>
	)
}
