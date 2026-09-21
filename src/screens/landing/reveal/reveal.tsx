import clsx from 'clsx'
import { createElement, type ReactNode } from 'react'
import styles from './reveal.module.css'

let sharedObserver: IntersectionObserver | null = null

// ═══════════════════════════════════════════════════════════════════════════
//   One observer for the whole page rather than one per block, and each
//   block is revealed once, then forgotten: scrolling back up never replays
//   an animation the reader has already seen.
//
//   A block starts `idle`, which is fully visible — the server HTML, a
//   crawler and a browser without JavaScript all see everything. The first
//   look decides its fate: a block already on screen, or above it (a reload
//   halfway down, a link to #faq), is `shown` as it stands, with no replay;
//   only a block below the fold is hidden (`off`) until it scrolls in (`on`).
//   Measuring the block itself, not the observer's shrunken root, keeps a
//   block in the bottom strip of the screen from vanishing on load.
// ═══════════════════════════════════════════════════════════════════════════
function revealObserver(): IntersectionObserver {
	sharedObserver ??= new IntersectionObserver(
		(entries, observer) => {
			for (const entry of entries) {
				const element = entry.target
				const state = element.getAttribute('data-reveal')

				if (state === 'idle') {
					const isBelowFold = entry.boundingClientRect.top >= window.innerHeight

					if (isBelowFold) {
						element.setAttribute('data-reveal', 'off')
					} else {
						element.setAttribute('data-reveal', 'shown')
						observer.unobserve(element)
					}
				} else if (state === 'off' && entry.isIntersecting) {
					element.setAttribute('data-reveal', 'on')
					observer.unobserve(element)
				}
			}
		},
		{ rootMargin: '0px 0px -10% 0px' },
	)

	return sharedObserver
}

// ═══════════════════════════════════════════════════════════════════════════
//   `immediate` animates straight from the server HTML, for what is on screen
//   at load; `stagger` reveals the direct children one after another.
//
//   A ref callback with a cleanup (React 19) instead of an effect: the node
//   is observed exactly while it is mounted, with no ref object to hold.
// ═══════════════════════════════════════════════════════════════════════════
function observe(element: HTMLElement | null) {
	if (!element) return

	const observer = revealObserver()
	observer.observe(element)

	return () => observer.unobserve(element)
}

type RevealProps = {
	as?: 'div' | 'ol' | 'ul'
	children: ReactNode
	className?: string
	immediate?: boolean
	stagger?: boolean
}

export function Reveal({
	as = 'div',
	children,
	className,
	immediate = false,
	stagger = false,
}: RevealProps) {
	return createElement(
		as,
		{
			className: clsx(styles.reveal, stagger && styles.stagger, className),
			'data-reveal': immediate ? 'on' : 'idle',
			ref: immediate ? undefined : observe,
		},
		children,
	)
}
