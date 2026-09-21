import { useRef } from 'react'
import styles from './letter-text.module.css'

const END_SLACK_PX = 8

type LetterTextProps = {
	streaming?: boolean
	text: string
}

// ═══════════════════════════════════════════════════════════════════════════
//   Paragraphs are real <p> elements rather than one pre-wrapped block, so
//   the letter has structure for assistive tech and spacing that does not
//   depend on how many blank lines the model chose to emit. While
//   streaming, a caret sits at the end of the last paragraph — where the
//   next word will land.
// ═══════════════════════════════════════════════════════════════════════════
export function LetterText({ streaming = false, text }: LetterTextProps) {
	const paragraphs = text.trim().split(/\n\s*\n/)
	const lastIndex = paragraphs.length - 1
	const following = useRef(true)

	// ═════════════════════════════════════════════════════════════════════════
	//   When the letter is taller than the panel it scrolls, and two things
	//   depend on where the reader is: the fade (shown while more lies below)
	//   and, while streaming, following the newest line — but only for a
	//   reader who has not scrolled up to reread. A resize observer on the
	//   text sees every new word that changes its height; the attribute is
	//   written straight to the DOM so scrolling never re-renders React.
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
				{paragraphs.map((paragraph, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: paragraphs only ever grow at the end while streaming
					<p key={index}>
						{paragraph}
						{streaming && index === lastIndex && (
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
