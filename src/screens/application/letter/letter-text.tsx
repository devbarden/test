import { useRef } from 'react'
import styles from './letter-text.module.css'

const END_SLACK_PX = 8

type LetterTextProps = {
	streaming?: boolean
	text: string
}

export function LetterText({ streaming = false, text }: LetterTextProps) {
	const paragraphs = paragraphsOf(text)
	const last = paragraphs.at(-1)
	const following = useRef(true)

	// ═════════════════════════════════════════════════════════════════════════
	//   Written straight to the DOM so scrolling never re-renders React.
	// ═════════════════════════════════════════════════════════════════════════
	const track = (scroller: HTMLDivElement | null) => {
		if (!scroller) return

		const observer = new ResizeObserver(() => {
			const isStreaming = scroller.getAttribute('aria-busy') === 'true'

			if (isStreaming && following.current) {
				scroller.scrollTop = scroller.scrollHeight
			}
			measure(scroller)
		})

		observer.observe(scroller)
		if (scroller.firstElementChild) observer.observe(scroller.firstElementChild)

		return () => observer.disconnect()
	}

	return (
		<div
			aria-busy={streaming}
			className={styles.root}
			onScroll={(event) => {
				following.current = measure(event.currentTarget) <= END_SLACK_PX
			}}
			ref={track}
		>
			<div className={styles.content}>
				{paragraphs.map((paragraph) => (
					<p key={paragraph.start}>
						{paragraph.text}
						{streaming && paragraph === last && (
							<span aria-hidden="true" className={styles.caret} />
						)}
					</p>
				))}
			</div>
		</div>
	)
}

function measure(scroller: HTMLElement): number {
	const remaining =
		scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop

	scroller.toggleAttribute('data-more', remaining > END_SLACK_PX)

	return remaining
}

// ═══════════════════════════════════════════════════════════════════════════
//   Each paragraph is keyed by the offset it starts at. The letter only ever
//   grows at its end, so a paragraph keeps its key — and its DOM node —
//   while the words after it stream in.
// ═══════════════════════════════════════════════════════════════════════════
function paragraphsOf(text: string): { start: number; text: string }[] {
	const body = text.trim()
	const paragraphs: { start: number; text: string }[] = []
	let start = 0

	for (const separator of body.matchAll(/\n\s*\n/g)) {
		paragraphs.push({ start, text: body.slice(start, separator.index) })
		start = separator.index + separator[0].length
	}

	paragraphs.push({ start, text: body.slice(start) })

	return paragraphs
}
