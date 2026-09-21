import styles from './letter-text.module.css'

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

	return (
		<div aria-busy={streaming} className={styles.letter}>
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
	)
}
