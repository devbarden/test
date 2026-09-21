import clsx from 'clsx'
import { type ComponentProps, createElement, type Ref } from 'react'
import styles from './panel.module.css'

type PanelProps = Omit<ComponentProps<'div'>, 'ref'> & {
	as?: 'article' | 'div' | 'li' | 'section'
	interactive?: boolean
	ref?: Ref<HTMLElement>
	tone?: 'muted' | 'success' | 'raised'
}

// ═══════════════════════════════════════════════════════════════════════════
//   The one container shape. In the app it is a borderless surface told
//   apart by its tint — grey for content, green for encouragement. On the
//   public pages it is `raised`: white, hairline-bordered and lifted by a
//   shadow, because it sits on a patterned page rather than a plain one.
//   `as` makes the panel itself the landmark or list item, instead of
//   wrapping a <section> in a <div> to get one.
// ═══════════════════════════════════════════════════════════════════════════
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
			styles.panel,
			styles[tone],
			interactive && styles.interactive,
			className,
		),
	})
}
