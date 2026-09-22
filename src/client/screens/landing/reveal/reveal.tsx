import clsx from 'clsx'
import { createElement, type ReactNode } from 'react'
import styles from './reveal.module.css'

let sharedObserver: IntersectionObserver | null = null

// ═══════════════════════════════════════════════════════════════════════════
//   Blocks start visible (SSR, no JS); only those below the fold
//   hide until scrolled in.
// ═══════════════════════════════════════════════════════════════════════════
function nextRevealState(entry: IntersectionObserverEntry): string | null {
	const state = entry.target.getAttribute('data-reveal')

	if (state === 'idle') {
		return entry.boundingClientRect.top >= window.innerHeight ? 'off' : 'shown'
	}

	return state === 'off' && entry.isIntersecting ? 'on' : null
}

function revealObserver(): IntersectionObserver {
	sharedObserver ??= new IntersectionObserver(
		(entries, observer) => {
			for (const entry of entries) {
				const next = nextRevealState(entry)

				if (!next) continue

				entry.target.setAttribute('data-reveal', next)
				if (next !== 'off') observer.unobserve(entry.target)
			}
		},
		{ rootMargin: '0px 0px -10% 0px' },
	)

	return sharedObserver
}

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

export function Reveal({ as = 'div', children, className, immediate = false, stagger = false }: RevealProps) {
	return createElement(
		as,
		{
			className: clsx(stagger ? styles.stagger : styles.single, className),
			'data-reveal': immediate ? 'on' : 'idle',
			ref: immediate ? undefined : observe,
		},
		children,
	)
}
