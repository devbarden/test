import clsx from 'clsx'
import type { ComponentProps } from 'react'
import styles from './heading.module.css'

type HeadingSize = 'sm' | 'md' | 'lg' | 'xl'

type HeadingTone = 'default' | 'muted'

type HeadingProps = ComponentProps<'h2'> & {
	as?: 'h1' | 'h2' | 'h3'
	size: HeadingSize
	tone?: HeadingTone
}

const SIZE_CLASS = {
	lg: styles.lg,
	md: styles.md,
	sm: styles.sm,
	xl: styles.xl,
} satisfies Record<HeadingSize, string | undefined>

const TONE_CLASS = {
	default: undefined,
	muted: styles.muted,
} satisfies Record<HeadingTone, string | undefined>

export function Heading({ as: Level = 'h2', className, size, tone = 'default', ...props }: HeadingProps) {
	return <Level {...props} className={clsx(styles.root, SIZE_CLASS[size], TONE_CLASS[tone], className)} />
}
