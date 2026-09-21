import clsx from 'clsx'
import { type ComponentProps, createElement, type Ref } from 'react'
import styles from './panel.module.css'

type PanelTone = 'muted' | 'success' | 'raised'

type PanelProps = Omit<ComponentProps<'div'>, 'ref'> & {
	as?: 'article' | 'div' | 'li' | 'section'
	interactive?: boolean
	ref?: Ref<HTMLElement>
	tone?: PanelTone
}

const TONE_CLASS = {
	muted: styles.muted,
	raised: styles.raised,
	success: styles.success,
} satisfies Record<PanelTone, string | undefined>

export function Panel({
	as: Element = 'div',
	className,
	interactive = false,
	tone = 'muted',
	...props
}: PanelProps) {
	return createElement(Element, {
		...props,
		className: clsx(
			styles.root,
			TONE_CLASS[tone],
			interactive && styles.interactive,
			className,
		),
	})
}
