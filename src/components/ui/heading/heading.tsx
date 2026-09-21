import clsx from 'clsx'
import type { ComponentProps } from 'react'
import styles from './heading.module.css'

type HeadingProps = ComponentProps<'h2'> & {
	as?: 'h1' | 'h2' | 'h3'
	size: 'sm' | 'md' | 'lg' | 'xl'
	tone?: 'default' | 'muted'
}

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
				styles.heading,
				styles[size],
				tone === 'muted' && styles.muted,
				className,
			)}
		/>
	)
}
